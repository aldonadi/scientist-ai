# Quick Links Fix Walkthrough

I have fixed the issue where default quick links were not loading in the Quick Links dialog.

## Changes

### app/links_dialog.py

I modified `links_dialog.py` to correctly reference the instance variable `self.links` instead of the empty static class variable `LinksDialog.links`.

```python
# Before
if len(LinksDialog.links) == 0:
    ...
for link in LinksDialog.links:
    ...

# After
if len(self.links) == 0:
    ...
for link in self.links:
    ...
```

### app/quick_links/repository.py

I corrected the path for loading managed quick links.

```python
# Before
path = os.path.join(base_dir, 'managed', 'managed_quick_links.json')

# After
path = os.path.join(base_dir, 'assets', 'managed', 'managed_quick_links.json')
```

## Verification Results

### Automated Tests
I ran the existing quick links tests to ensure no regressions were introduced.

```bash
$ python -m pytest test/test_quick_links.py
=========== test session starts ===========
platform linux -- Python 3.12.3, pytest-8.4.1, pluggy-1.6.0
rootdir: /home/andrew/Projects/Code/python/nyiso-rt-v-dam-monitor
configfile: pyproject.toml
plugins: qt-4.4.0, cov-6.2.1
collected 10 items

test/test_quick_links.py .......... [100%]

=========== 10 passed in 0.15s ============
```

### Manual Verification
You should now be able to see the managed quick links when opening the dialog. The code now correctly points to `assets/managed/managed_quick_links.json`.
