from pydantic import BaseModel , Field 
from typing import Literal

class BulkGetRequest(BaseModel):
    """
    Base schema for bulk retrieval requests
    """
    limit : int = Field(default=10 , gt=0 , le=100 , description="Number of items to retrieve")
    offset : int = Field(default=0 , ge=0 , description="Number of items to skip")
    sort_order : Literal['asc','desc'] = Field(default='desc' , description="Order of items to retrieve")
    

class ListResponse(BaseModel):
    """Paginated list response with total , limit and offset."""
    total: int
    limit: int
    offset: int

