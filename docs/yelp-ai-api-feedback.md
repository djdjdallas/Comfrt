# Yelp AI API Feedback & Observations

**Date:** December 2024
**Context:** Building Comfrt, a comfort-focused venue discovery app using Yelp AI Chat API v2

---

## Overview

This document captures observations and suggestions for improving the Yelp AI API based on real-world implementation experience building a sensory-friendly venue discovery application.

---

## Key Observations

### 1. Follow-up Questions Perform New Searches Instead of Filtering

**Issue:** When a user asks a follow-up question like "anything with outdoor seating?" after an initial search, the API performs an entirely new search rather than filtering the previously returned businesses.

**Current Behavior:**
```
User: "Find a quiet Italian restaurant in Los Angeles"
→ Returns: Restaurant A, B, C

User: "Anything with outdoor seating?"
→ Returns: Restaurant D, E, F (completely different set)
```

**Expected Behavior:**
```
User: "Find a quiet Italian restaurant in Los Angeles"
→ Returns: Restaurant A, B, C

User: "Anything with outdoor seating?"
→ Returns: Restaurant B (filtered from original set that has outdoor seating)
```

**Impact:** Users expect conversational refinement. Getting different results breaks the mental model of "narrowing down" options.

**Suggestion:** Add a parameter like `filter_mode: true` or detect intent automatically to filter existing results vs. perform new searches.

---

### 2. Limited Result Set from Large Markets

**Issue:** In large markets like Los Angeles (thousands of restaurants), the API consistently returns 3-6 businesses. For niche queries like "quiet Italian restaurant," this small sample may not include venues that actually match the criteria well.

**Observation:** The same popular restaurants appear across different searches, suggesting the algorithm heavily favors established/popular venues.

**Suggestions:**
- Allow developers to request more results (e.g., `limit: 20`)
- Provide a `diversity` parameter to surface lesser-known but relevant venues
- Return a confidence score for how well each result matches the query

---

### 3. Noise Level Data is Sparse

**Issue:** The `noise_level` attribute is critical for accessibility/sensory-friendly apps but is rarely populated in business data.

**Current State:**
- Most businesses don't have `noise_level` set
- When present, values are often generic ("average")
- No way to search/filter by noise level directly

**Suggestions:**
- Encourage businesses to add noise level during onboarding
- Infer noise level from review sentiment analysis (Yelp has the data)
- Add `noise_level` as a searchable filter parameter
- Provide confidence scores for inferred attributes

---

### 4. Review Snippets Don't Target Query Intent

**Issue:** When asking about "atmosphere, noise levels, and ambiance," the returned `review_snippets` don't necessarily contain mentions of these topics.

**Example:**
```
Query: "Tell me about the noise levels at Restaurant X"
Returned snippet: "The pasta was amazing and service was quick!"
```

**Suggestion:** When the query asks about specific attributes (noise, ambiance, lighting, crowd levels), prioritize review snippets that mention those topics.

---

### 5. No Attribute-Based Filtering in Natural Language

**Issue:** Natural language queries like "quiet restaurant with outdoor seating" don't reliably filter by both criteria. The AI understands the intent but can't enforce hard filters.

**Suggestions:**
- Support hybrid queries: natural language + explicit filters
- Example: `{ query: "Italian restaurant", filters: { outdoor_seating: true, noise_level: "quiet" } }`
- Return which filters were applied vs. which were "best effort"

---

### 6. Conversation Context (chat_id) Limitations

**Issue:** The `chat_id` maintains conversation history but doesn't allow referencing specific businesses from previous turns reliably.

**Example that doesn't work well:**
```
Turn 1: "Find Italian restaurants" → Returns A, B, C
Turn 2: "Which one is quietest?" → May not compare A, B, C specifically
```

**Suggestion:** Expose the business IDs from previous turns so developers can reference them explicitly, or improve the AI's ability to compare previously returned results.

---

### 7. Missing Sensory/Accessibility Attributes

**Issue:** For users with sensory sensitivities (autism, anxiety, PTSD, misophonia), additional attributes would be valuable but aren't available:

**Desired attributes:**
- `lighting_type`: bright/dim/natural
- `music_volume`: none/soft/loud
- `crowd_density`: by time of day
- `seating_options`: booth/table/bar/outdoor
- `noise_sources`: live music, TV sports, open kitchen, etc.

**Suggestion:** Consider an "accessibility" or "sensory" category of attributes that businesses can self-report or that can be inferred from reviews.

---

## Workarounds We Implemented

Given these limitations, here's how we adapted:

1. **Client-side filtering:** Store previous results and filter locally when follow-ups ask for attributes
2. **Claude AI analysis:** Send review text to Claude to extract noise/comfort signals that Yelp doesn't surface
3. **Keyword analysis:** Scan review text for comfort-related keywords (quiet, peaceful, loud, crowded, etc.)
4. **Category inference:** Assume cafes/tea houses are quieter than bars/sports venues as a fallback
5. **Follow-up intent detection:** Detect when a user wants to filter vs. search fresh

---

## Summary of Suggestions

| Priority | Suggestion |
|----------|------------|
| High | Add result filtering mode for follow-up questions |
| High | Increase max results for large markets |
| High | Improve `noise_level` data coverage |
| Medium | Target review snippets to query intent |
| Medium | Support hybrid natural language + explicit filters |
| Medium | Better conversation context for comparing results |
| Low | Add sensory/accessibility attributes |

---

## Contact

Feel free to reach out with questions about these observations or to discuss implementation details.
