# Test cases

- Establish bidirectional data connections
- Send bidirectional data messages
- On data connection end, update of connected state with connect interval ON on remote
- On data connection end, allow reconnect on demand with connect interval OFF on local

- On media call, status should be waiting on local and calling on remote
- On media call timeout, status should be set to inactive on both
- On media end, status should be set to inactive in both (Not possible when call not active)