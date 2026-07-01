from pydantic import BaseModel , Field 
from typing import Literal
from enum import Enum

class BulkGetRequest(BaseModel):
    """
    Base schema for bulk retrieval requests
    """
    limit : int = Field(default=10 , gt=0 , le=100 , description="Number of items to retrieve")
    offset : int = Field(default=0 , ge=0 , description="Number of items to skip")
    sort_order : Literal['asc','desc'] = Field(default='desc' , description="Order of items to retrieve")
    q : str  = Field(description="Search query" , default="")
    

class ListResponse(BaseModel):
    """Paginated list response with total , limit and offset."""
    total: int
    limit: int
    offset: int
    


class ELOTiers(Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    diamond = "diamond"


class ELOThreshold(Enum):
    diamond = 2000
    gold = 1500
    silver = 1000
    bronze = 0


class MatchLevel(Enum):
    easy = "easy"
    medium = "medium"
    difficult = "difficult"
    extreme = "extreme"
    impossible = "impossible"
    custom = "custom"