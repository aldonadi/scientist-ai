# Fix Managed Quick Links Path

The application currently attempts to load managed quick links from `app/managed/managed_quick_links.json`, but the file is actually located at `app/assets/managed/managed_quick_links.json`.

## User Review Required
None.

## Proposed Changes

### App
#### [MODIFY] [repository.py](file:///home/andrew/Projects/Code/python/nyiso-rt-v-dam-monitor/app/quick_links/repository.py)
- Update `_load_managed` method to point to `assets/managed/managed_quick_links.json` instead of `managed/managed_quick_links.json`.

## Verification Plan

### Manual Verification
1.  Run the application.
2.  Open the Quick Links dialog.
3.  Verify that managed quick links (if any are defined in that file) are displayed.
4.  Check logs to ensure "Loading managed quick links..." is followed by successful parsing of items.
