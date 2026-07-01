"""
This module contains shared utility functions for the backend. 
"""


def apply_sort_order(stmt, column, sort_order: str):
    """Apply ascending or descending order to a SQLModel statement."""
    if sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())



def generate_hateoas_links(total: int, limit: int, offset: int) -> list[dict]:
    """Generate page navigation links following hypermedia/HATEOAS constraints.

    Renders a standard page range: First Page, Previous Page, Adjacent Pages,
    Ellipsis placeholders, Next Page, and Last Page.
    """
    links = []
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    current_page = (offset // limit) + 1

    # 1. Previous navigation link
    if current_page > 1:
        links.append({
            "rel": "prev",
            "label": "Previous",
            "offset": max(0, offset - limit),
            "is_active": False
        })

    # 2. Page Range buttons
    if total_pages <= 5:
        for p in range(1, total_pages + 1):
            links.append({
                "rel": "page",
                "label": str(p),
                "offset": (p - 1) * limit,
                "is_active": (p == current_page)
            })
    else:
        # First page
        links.append({
            "rel": "first",
            "label": "1",
            "offset": 0,
            "is_active": (current_page == 1)
        })

        if current_page > 3:
            links.append({
                "rel": "ellipsis",
                "label": "...",
                "offset": None,
                "is_active": False
            })

        start = max(2, current_page - 1)
        end = min(total_pages - 1, current_page + 1)
        for p in range(start, end + 1):
            if p > 1 and p < total_pages:
                links.append({
                    "rel": "page",
                    "label": str(p),
                    "offset": (p - 1) * limit,
                    "is_active": (p == current_page)
                })

        if current_page < total_pages - 2:
            links.append({
                "rel": "ellipsis",
                "label": "...",
                "offset": None,
                "is_active": False
            })

        # Last page
        links.append({
            "rel": "last",
            "label": str(total_pages),
            "offset": (total_pages - 1) * limit,
            "is_active": (current_page == total_pages)
        })

    # 3. Next navigation link
    if current_page < total_pages:
        links.append({
            "rel": "next",
            "label": "Next",
            "offset": offset + limit,
            "is_active": False
        })

    return links

