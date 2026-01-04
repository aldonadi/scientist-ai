# User Story Backlog

The ground-truth tracker for user story status for tracking their completion.

Story Number corresponds with the actual User Story data file under `./stories`. For example, `026_implement_list_experiments` corresponds with story file at `./stories/026_implement_list_experiments.md`.

Story Points is how many points the story is worth, as listed in the Story file.

Status can be:

- `NOT READY`: Not yet ready for working on. Some constraint is blocking this. Don't choose these for implementation.
- `READY`: All dependencies are satisfied: this user story is ready for being worked on.
- `IN-PROGRESS`: Someone has chosen this for working on and they are actively working it.
- `STUCK`: Has been started, but progress is stuck for some reason. See the Story file for info.
- `REVIEW`: The owner of this story thinks it is done, and it is awaiting peer review and acceptance.
- `DONE`: The eventual resting place of, hopefully, all user stories. It has been implemented!
- `CANCELLED`: We have decided that this user story will not be implemented. See the Story file for details.

| Story                                              | Points | Status      |
| --                                                 | --     | --          |
| 000_familiarize_with_agile_administration          | 1      | DONE        |
