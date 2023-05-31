.PHONY:ALL

output=WeiBack.user.js

$(output): src/first.js src/lru-cache.js src/fetch.js src/htmlGenerator.js src/main.js
	cat $^ > $@
