from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from dotenv import load_dotenv
from datetime import datetime
import logging
import json
from pymongo import MongoClient
import asyncio



# Load environment variables
load_dotenv()

import os
os.environ.pop("GOOGLE_API_KEY", None)

print(f"Gemini API key loaded: {len(os.getenv('GEMINI_API_KEY', ''))>0}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ModMind API",
    description="AI-powered Reddit moderation suite",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# MongoDB Configuration
MONGODB_URI = os.environ.get("MONGODB_URI")
mongo_client = MongoClient(
    MONGODB_URI,
    tls=True,
    tlsAllowInvalidCertificates=True
)
db = mongo_client["modmind"]
decisions_collection = db["mod_decisions"]


# Pydantic models
class Post(BaseModel):
    id: str
    title: str
    author: str
    score: int
    url: str
    selftext: Optional[str] = None
    created_utc: float
    num_comments: int
    subreddit: str
    permalink: str

class AnalysisResult(BaseModel):
    post_id: str
    sentiment: str
    toxicity_score: float
    suggested_action: str
    reasoning: str
    confidence: float

class SubredditStats(BaseModel):
    subreddit_name: str
    subscriber_count: int
    active_users: int
    total_posts: int
    total_comments: int
    avg_score: float

class AnalysisRequest(BaseModel):
    post_id: str
    subreddit: str
    content: str
    title: str

# Helper functions
async def fetch_reddit_json(url: str) -> Dict[str, Any]:
    """Fetch JSON data from Reddit's public API"""
    headers = {
        "User-Agent": "python:modmind:v1.0 (by /u/vignan-Chowdary123)",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    await asyncio.sleep(1)
    async with httpx.AsyncClient(
        headers=headers,
        follow_redirects=True,
        timeout=30.0
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

def analyze_content_with_ai(content: str, title: str) -> Dict[str, Any]:
    """Analyze post content using Gemini AI"""
    try:
        prompt = f"""
        Analyze this Reddit post for moderation purposes:
        
        Title: {title}
        Content: {content}
        
        Provide:
        1. Sentiment (positive, neutral, negative)
        2. Toxicity score (0.0 to 1.0)
        3. Suggested moderation action (approve, remove, flag, monitor)
        4. Brief reasoning
        5. Confidence level (0.0 to 1.0)
        
        Respond in JSON format with keys: sentiment, toxicity_score, suggested_action, reasoning, confidence
        """
        
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        result_text = response.text
        
        # Clean up markdown code blocks if present in the response
        clean_text = result_text.strip()
        if clean_text.startswith("```"):
            first_nl = clean_text.find("\n")
            if first_nl != -1:
                clean_text = clean_text[first_nl:].strip()
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3].strip()
                
        result = json.loads(clean_text)
        return result
    except Exception as e:
        logger.error(f"Error analyzing content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ModMind API - AI-powered Reddit moderation suite",
        "version": "1.0.0",
        "endpoints": {
            "posts": "/api/posts/{subreddit}",
            "analyze": "/api/analyze",
            "stats": "/api/stats/{subreddit}"
        }
    }

@app.get("/api/posts/{subreddit}", response_model=List[Post])
async def fetch_posts(
    subreddit: str,
    limit: int = Query(default=25, ge=1, le=100),
    sort: str = Query(default="hot", pattern="^(hot|new|top|rising)$")
):
    """
    Fetch posts from a subreddit
    
    - subreddit: Name of the subreddit
    - limit: Number of posts to fetch (1-100)
    - sort: Sorting method (hot, new, top, rising)
    """
    try:
        # Map sort types to Reddit API endpoints
        sort_map = {
            "hot": "hot",
            "new": "new",
            "top": "top",
            "rising": "rising"
        }
        
        url = f"https://www.reddit.com/r/{subreddit}/{sort_map[sort]}.json?limit={limit}&raw_json=1"
        data = await fetch_reddit_json(url)
        
        result = []
        for post_data in data["data"]["children"]:
            post = post_data["data"]
            result.append(Post(
                id=post["id"],
                title=post["title"],
                author=post.get("author", "[deleted]"),
                score=post["score"],
                url=post["url"],
                selftext=post.get("selftext"),
                created_utc=post["created_utc"],
                num_comments=post["num_comments"],
                subreddit=post["subreddit"],
                permalink=post["permalink"]
            ))
        
        logger.info(f"Fetched {len(result)} posts from r/{subreddit}")
        return result
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching posts from r/{subreddit}: {str(e)}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch posts: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching posts from r/{subreddit}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch posts: {str(e)}")

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_post(request: AnalysisRequest):
    """
    Analyze a Reddit post using AI and suggest moderation actions
    
    - post_id: ID of the post to analyze
    - subreddit: Name of the subreddit
    - content: Post content/text
    - title: Post title
    """
    try:
        # Analyze content with AI
        analysis = analyze_content_with_ai(request.content, request.title)
        
        result = AnalysisResult(
            post_id=request.post_id,
            sentiment=analysis.get("sentiment", "neutral"),
            toxicity_score=analysis.get("toxicity_score", 0.0),
            suggested_action=analysis.get("suggested_action", "monitor"),
            reasoning=analysis.get("reasoning", "No reasoning provided"),
            confidence=analysis.get("confidence", 0.5)
        )
        
        logger.info(f"Analyzed post {request.post_id}: {result.suggested_action}")
        
        post_data = {
            "id": request.post_id,
            "title": request.title,
            "subreddit": request.subreddit
        }
        if "action" not in analysis:
            analysis["action"] = analysis.get("suggested_action", "monitor")

        try:
            decisions_collection.insert_one({
                "post_id": post_data.get("id", ""),
                "post_title": post_data.get("title", ""),
                "subreddit": post_data.get("subreddit", ""),
                "toxicity_score": analysis.get("toxicity_score", 0),
                "sentiment": analysis.get("sentiment", ""),
                "action": analysis.get("action", ""),
                "analyzed_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"MongoDB logging error: {e}")

        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Gemini API error: {e}")
        print(f"Error type: {type(e).__name__}")
        logger.error(f"Error analyzing post {request.post_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/stats/{subreddit}", response_model=SubredditStats)
async def get_subreddit_stats(subreddit: str):
    """
    Get statistics for a subreddit
    
    - subreddit: Name of the subreddit
    """
    try:
        # Fetch subreddit info and recent posts
        url = f"https://www.reddit.com/r/{subreddit}/about.json"
        about_data = await fetch_reddit_json(url)
        
        posts_url = f"https://www.reddit.com/r/{subreddit}/new.json?limit=100"
        posts_data = await fetch_reddit_json(posts_url)
        
        posts = posts_data["data"]["children"]
        total_score = sum(post["data"]["score"] for post in posts)
        avg_score = total_score / len(posts) if posts else 0
        total_comments = sum(post["data"]["num_comments"] for post in posts)
        
        stats = SubredditStats(
            subreddit_name=subreddit,
            subscriber_count=about_data["data"]["subscribers"],
            active_users=about_data["data"].get("active_user_count", 0),
            total_posts=len(posts),
            total_comments=total_comments,
            avg_score=round(avg_score, 2)
        )
        
        logger.info(f"Fetched stats for r/{subreddit}")
        return stats
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching stats for r/{subreddit}: {str(e)}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch stats: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching stats for r/{subreddit}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@app.get("/api/post/{subreddit}/{post_id}", response_model=Post)
async def get_post(subreddit: str, post_id: str):
    """
    Get a specific post by ID
    
    - subreddit: Name of the subreddit
    - post_id: ID of the post
    """
    try:
        url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json"
        data = await fetch_reddit_json(url)
        
        post_data = data[0]["data"]["children"][0]["data"]
        result = Post(
            id=post_data["id"],
            title=post_data["title"],
            author=post_data.get("author", "[deleted]"),
            score=post_data["score"],
            url=post_data["url"],
            selftext=post_data.get("selftext"),
            created_utc=post_data["created_utc"],
            num_comments=post_data["num_comments"],
            subreddit=post_data["subreddit"],
            permalink=post_data["permalink"]
        )
        
        return result
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching post {post_id}: {str(e)}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Post not found: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching post {post_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch post: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
