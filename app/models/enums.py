import enum


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class IssueStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class IssuePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IssueCategory(str, enum.Enum):
    ROAD = "ROAD"
    WATER = "WATER"
    ELECTRICITY = "ELECTRICITY"
    GARBAGE = "GARBAGE"
    DRAINAGE = "DRAINAGE"
    STREETLIGHT = "STREETLIGHT"
    PARK = "PARK"
    PUBLIC_TRANSPORT = "PUBLIC_TRANSPORT"
    SANITATION = "SANITATION"
    NOISE = "NOISE"
    OTHER = "OTHER"
