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
| 001_project_initialization                         | 1      | DONE        |
| 002_setup_database_connection                      | 1      | DONE        |
| 003_backend_error_handling                         | 2      | DONE        |
| 004_tool_model_schema                              | 1      | DONE        |
| 005_api_create_tool                                | 2      | DONE        |
| 006_api_list_tools                                 | 2      | DONE        |
| 007_api_get_tool                                   | 1      | DONE        |
| 008_api_update_tool                                | 2      | DONE        |
| 009_api_delete_tool                                | 1      | DONE        |
| 037_environment_schema                             | 2      | DONE        |
| 038_provider_schema                                | 2      | DONE        |
| 039_model_config_schema                            | 2      | DONE        |
| 040_role_schema                                    | 3      | DONE        |
| 041_goal_schema                                    | 2      | DONE        |
| 042_script_schema                                  | 2      | DONE        |
| 043_experiment_plan_schema                         | 3      | DONE        |
| 044_secret_storage_interface                       | 3      | DONE        |
| 010_plan_model_schema                              | 9      | CANCELLED   |
| 011_api_create_plan                                | 2      | DONE        |
| 012_api_list_plans                                 | 2      | DONE        |
| 013_api_get_plan                                   | 1      | DONE        |
| 014_api_update_plan                                | 3      | DONE        |
| 045_api_delete_plan                                | 1      | DONE        |
| 015_experiment_model_schema                        | 1      | DONE        |
| 016_log_model_schema                               | 1      | DONE        |
| 017_api_launch_experiment                          | 3      | DONE        |
| 018_event_bus_system                               | 3      | DONE        |
| 019_logger_service                                 | 3      | DONE        |
| 020_container_pool_manager                         | 8      | DONE        |
| 021_container_execution_wrapper                    | 5      | DONE        |
| 022_llm_provider_interface                         | 3      | DONE        |
| 023_ollama_integration                             | 3      | DONE        |
| 024_orchestrator_initialization                    | 5      | DONE        |
| 025_orchestrator_step_loop                         | 8      | DONE        |
| 026_role_prompt_construction                       | 5      | DONE        |
| 027_tool_execution_logic                           | 5      | DONE        |
| 028_goal_evaluation_logic                          | 3      | DONE        |
| 046_script_and_hook_system                         | 5      | DONE        |
| 047_experiment_control_api                         | 5      | REVIEW      |
| 029_setup_frontend_layout                          | 3      | NOT READY   |
| 030_ui_tool_list                                   | 2      | NOT READY   |
| 031_ui_tool_editor                                 | 5      | NOT READY   |
| 032_ui_plan_list                                   | 2      | NOT READY   |
| 033_ui_plan_editor_basic                           | 3      | NOT READY   |
| 034_ui_plan_editor_roles                           | 5      | NOT READY   |
| 035_ui_experiment_monitor                          | 8      | NOT READY   |
| 036_ui_realtime_logs                               | 5      | NOT READY   |


