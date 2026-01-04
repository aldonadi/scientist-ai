import os

# Populate the stories list with the stories you want to generate.
# stories = [
#     {
#         "id": "036",
#         "name": "ui_realtime_logs",
#         "title": "Implement Realtime Log Streaming",
#         "points": 5,
#         "type": "Feature",
#         "description": "Connect the Experiment Monitor to the specialized SSE endpoint/logic to stream logs.",
#         "user_story": "**As a** User,\n**I want** to see logs as they happen,\n**So that** I don't have to refresh.",
#         "acceptance_criteria": [
#             "Subscribes to log stream.",
#             "Appends new logs to the feed.",
#             "Autoscroll behavior."
#         ],
#         "testing": [
#             "Run experiment.",
#             "Watch logs appear."
#         ]
#     }
# ]

# Path to stories directory
stories_dir = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/stories"
backlog_path = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/backlog.md"

# 1. Create Story Files
for story in stories:
    filename = f"{story['id']}_{story['name']}.md"
    filepath = os.path.join(stories_dir, filename)
    
    content = f"""# {story['title']}

- **Status:** READY
- **Points:** {story['points']}
- **Story ID:** {story['id']}
- **Type:** {story['type']}

## Description
{story['description']}

## User Story
{story['user_story']}

## Acceptance Criteria
"""
    for ac in story['acceptance_criteria']:
        content += f"- [ ] {ac}\n"
    
    content += "\n## Testing\n"
    for i, test in enumerate(story['testing']):
        content += f"{i+1}. {test}\n"
    
    content += "\n## Review\n"
    
    with open(filepath, 'w') as f:
        f.write(content)

# 2. Append to Backlog
with open(backlog_path, 'r') as f:
    backlog_content = f.read()

# Only append if not already present (checking by ID roughly)
new_rows = ""
for story in stories:
    story_filename_base = f"{story['id']}_{story['name']}"
    if story_filename_base not in backlog_content:
        new_rows += f"| {story_filename_base:<50} | {story['points']:<6} | READY       |\n"

if new_rows:
    with open(backlog_path, 'a') as f:
        f.write(new_rows)

print(f"Generated {len(stories)} stories and updated backlog.")
