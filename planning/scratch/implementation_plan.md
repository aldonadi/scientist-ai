# Tool Editor Boilerplate Code

## Goal Description
Improve the "New Tool" experience by pre-populating the code editor with a boilerplate Python script instead of just showing it as a placeholder hint. This allows users to immediately start editing a working structure.

## Proposed Changes

### Frontend Components (`src/app/features/tools/`)

#### [MODIFY] `tool-editor.component.ts`
- Define a constant `DEFAULT_TOOL_CODE` containing the boilerplate Python function.
- In `ngOnInit`, if `isNew` is true, initialize `this.tool.code` with `DEFAULT_TOOL_CODE`.
- Remove the `placeholder` attribute from the textarea.

**Boilerplate Template:**
```python
def execute(env, args):
    """
    Description of what this tool does.
    
    Args:
        arg_name (type): Description of argument
        
    Returns:
        dict: Result of execution (must be JSON serializable)
    """
    # Access environment state variables (if needed)
    # stock_data = env.get('stock_data', {})
    
    # Access arguments passed by the model
    # param = args.get('arg_name')

    # Your implementation here
    
    # Return a dictionary, list, or primitive that can be serialized to JSON
    # This result will be passed back to the model
    return {"status": "success", "data": "..."}
```

## Verification Plan

### Manual Verification
1.  **Navigate** to the "Tools" list.
2.  **Click** "Create Tool" (or equivalent button to access `/tools/new`).
3.  **Verify** that the Code Editor is **not empty**, but contains the boilerplate code.
4.  **Verify** that the user can edit the text immediately.
