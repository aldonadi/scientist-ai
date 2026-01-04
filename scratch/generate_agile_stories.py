import os
import re

# Populate the stories list with the stories you want to generate.
# You do NOT need to specify 'id'. The script will auto-assign the next available ID.
stories = [
    # Example:
    # {
    #     "name": "example_story_slug",
    #     "title": "Example Story Title",
    #     "points": 1,
    #     "type": "Feature",
    #     "description": "Description of the story.",
    #     "user_story": {
    #         "as_a": "Somebody",
    #         "i_want": "something",
    #         "so_that": "I can accomplish my goal"
    #     },
    #     "acceptance_criteria": [
    #         "Criteria 1",
    #         "Criteria 2"
    #     ],
    #     "testing": [
    #         "Test step 1"
    #     ]
    # }
]

# Path to stories directory
stories_dir = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/stories"
backlog_path = "/home/andrew/Projects/Code/web/scientist-ai/planning/agile/backlog.md"

def get_next_id(directory):
    max_id = 0
    pattern = re.compile(r"^(\d{3})_")
    
    if os.path.exists(directory):
        for filename in os.listdir(directory):
            match = pattern.match(filename)
            if match:
                current_id = int(match.group(1))
                if current_id > max_id:
                    max_id = current_id
    
    return max_id + 1

# 1. Determine starting ID
next_id_num = get_next_id(stories_dir)
print(f"Starting with ID: {next_id_num:03d}")

# 2. Create Story Files
generated_stories = []

for story in stories:
    # Auto-assign ID
    story_id = f"{next_id_num:03d}"
    story['id'] = story_id
    next_id_num += 1
    
    filename = f"{story_id}_{story['name']}.md"
    filepath = os.path.join(stories_dir, filename)
    
    content = f"""# {story['title']}

- **Status:** READY
- **Points:** {story['points']}
- **Story ID:** {story_id}
- **Type:** {story['type']}

## Description
{story['description']}

## User Story
**As a** {story['user_story']['as_a']},
**I want** {story['user_story']['i_want']},
**So that** {story['user_story']['so_that']}

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
    
    generated_stories.append(story)
    print(f"Created: {filename}")

# 3. Append to Backlog
if generated_stories:
    with open(backlog_path, 'r') as f:
        backlog_content = f.read()

    new_rows = ""
    for story in generated_stories:
        story_filename_base = f"{story['id']}_{story['name']}"
        # double check it's not already in (though with new IDs it shouldn't be)
        if story_filename_base not in backlog_content:
            new_rows += f"| {story_filename_base:<50} | {story['points']:<6} | READY       |\n"

    if new_rows:
        with open(backlog_path, 'a') as f:
            f.write(new_rows)
        print("Updated backlog.")
    else:
        print("Backlog already up to date (no new unique entries).")
else:
    print("No new stories to generate.")
