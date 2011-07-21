UGLIFY=vendor/uglifyjs

all: src/sketch.min.js demo/js/sketch.js

# Compress version
src/sketch.min.js : src/sketch.js
	${UGLIFY} src/sketch.js > src/sketch.min.js

# Demo version
demo/js/sketch.js : src/sketch.js
	cp src/sketch.js demo/js/