.PHONY:ALL

output=weibo-backup.user.js

$(output): src/first.js src/save.js src/fetch.js src/main.js
	cat $^ > $@