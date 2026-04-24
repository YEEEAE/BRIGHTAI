# Upstream `EXAMPLES.md`

المصدر: `forrestchang/andrej-karpathy-skills`

هذا الملف ينقل أمثلة المستودع الأصلي بصياغتها العملية حتى تبقى ضمن المهارة كمرجع تطبيقي.

## 1. Think Before Coding

### Example 1: Hidden Assumptions

**User Request:** "Add a feature to export user data"

**❌ What LLMs Do (Wrong Assumptions)**

```python
def export_users(format='json'):
    """Export all users to a file."""
    users = User.query.all()
    if format == 'json':
        with open('users.json', 'w') as f:
            json.dump([u.to_dict() for u in users], f)
    elif format == 'csv':
        with open('users.csv', 'w') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'email', 'name'])
            writer.writeheader()
            writer.writerows([u.to_dict() for u in users])
    return f"Exported {len(users)} users"
```

**Problems:**

- Assumed it should export ALL users
- Assumed file location without asking
- Assumed which fields to include
- Assumed CSV fieldnames without checking actual data structure

**✅ What Should Happen (Surface Assumptions)**

```text
Before implementing, I need to clarify:
1. Scope: Export all users or filtered subset?
2. Format: Download file in browser, background job, or API response?
3. Fields: Which user fields are allowed?
4. Volume: How many users typically?

Simplest approach: Add an API endpoint that returns paginated JSON.
What's your preference?
```

### Example 2: Multiple Interpretations

**User Request:** "Make the search faster"

**❌ What LLMs Do (Pick Silently)**

```python
@lru_cache(maxsize=1000)
async def search(query: str) -> list:
    # ... 200 lines of optimization code
    pass
```

**✅ What Should Happen**

```text
"Make the search faster" could mean:
1. Faster response time
2. Higher concurrency
3. Faster perceived speed

Which aspect matters most for your use case?
```

## 2. Simplicity First

### Example 1: Over-abstraction

**User Request:** "Add a function to calculate discount"

**❌ Overengineered**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float:
        pass

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: float):
        self.percentage = percentage

    def calculate(self, amount: float) -> float:
        return amount * (self.percentage / 100)

@dataclass
class DiscountConfig:
    strategy: DiscountStrategy
    min_purchase: float = 0.0
```

**✅ Simple**

```python
def calculate_discount(amount: float, percent: float) -> float:
    """Calculate discount amount."""
    return amount * (percent / 100)
```

### Example 2: Speculative Features

**User Request:** "Save user preferences to database"

**❌ Unnecessary Features**

```python
class PreferenceManager:
    def __init__(self, db, cache=None, validator=None):
        self.db = db
        self.cache = cache or InMemoryCache()
        self.validator = validator or DefaultValidator()
```

**✅ Just What Was Asked**

```python
def save_preferences(db, user_id: int, preferences: dict):
    """Save user preferences to database."""
    db.execute(
        "UPDATE users SET preferences = ? WHERE id = ?",
        (json.dumps(preferences), user_id),
    )
```

## 3. Surgical Changes

### Example 1: Drive-by Refactoring

**User Request:** "Fix the bug where empty emails crash the validator"

**❌ Too Much**

- Improved unrelated validation
- Added username constraints nobody asked for
- Changed comments and structure

**✅ Surgical**

```diff
def validate_user(user_data):
    # Check email format
-   if not user_data.get('email'):
+   email = user_data.get('email', '')
+   if not email or not email.strip():
        raise ValueError("Email required")
-   if '@' not in user_data['email']:
+   if '@' not in email:
        raise ValueError("Invalid email")
```

### Example 2: Style Drift

**User Request:** "Add logging to the upload function"

**✅ Correct direction**

- Match existing quote style
- Avoid opportunistic type hints
- Keep surrounding boolean logic intact
- Add only the logging needed for the request

## 4. Goal-Driven Execution

### Example 1: Vague vs. Verifiable

**User Request:** "Fix the authentication system"

**✅ What Should Happen**

```text
Define the actual issue first.

Plan:
1. Write a test that reproduces the auth bug.
2. Implement the smallest fix.
3. Verify regression coverage still passes.
```

### Example 2: Multi-Step with Verification

**User Request:** "Add rate limiting to the API"

**✅ Incremental Plan**

```text
1. Add basic in-memory rate limiting.
   Verify: requests over the threshold return 429.
2. Extract it to shared middleware.
   Verify: multiple endpoints are covered.
3. Add shared storage if needed.
   Verify: behavior survives restarts / multi-instance use.
4. Add configuration.
   Verify: different endpoints respect different limits.
```
