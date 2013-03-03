# Makefile for SwimVeg
#
# Copyright (c) 2009-1013 Meadhbh S. Hamrick, All Rights Reserved
#

MODULES       = connect nodify-app mysql
BOOTSTRAP_V   = 2.2.2
BOOTSTRAP     = https://github.com/twitter/bootstrap/archive/v$(BOOTSTRAP_V).tar.gz
LESS_V        = 1.3.3
LESS          = https://raw.github.com/cloudhead/less.js/master/dist/less-$(LESS_V).min.js
HANDLEBARS_V  = 1.0.rc.2
HANDLEBARS    = https://raw.github.com/wycats/handlebars.js/$(HANDLEBARS_V)/dist/handlebars.js
UNDERSCORE    = http://underscorejs.org/underscore-min.js

WGET          = wget --no-check-certificate

default : node_modules static/bootstrap static/js/less.min.js \
    static/js/handlebars.js static/js/underscore-min.js

clean :
	rm -rf node_modules
	rm -rf static/bootstrap static/bootstrap-$(BOOTSTRAP_V)
	rm -f  v$(BOOTSTRAP_V).tar.gz
	rm -f  static/js/less.min.js
	rm -f  static/js/handlebars.js
	rm -f  static/js/underscore-min.js

v$(BOOTSTRAP_V).tar.gz :
	$(WGET) -O v$(BOOTSTRAP_V).tar.gz $(BOOTSTRAP)

static/bootstrap : v$(BOOTSTRAP_V).tar.gz
	( cd static ; tar xzvf ../v$(BOOTSTRAP_V).tar.gz ; ln -s bootstrap-$(BOOTSTRAP_V) bootstrap )

static/js/less.min.js :
	$(WGET) -O static/js/less.min.js $(LESS)

static/js/handlebars.js :
	$(WGET) -O static/js/handlebars.js $(HANDLEBARS)

static/js/underscore-min.js :
	$(WGET) -O static/js/underscore-min.js $(UNDERSCORE)

node_modules :
	mkdir node_modules
	npm install $(MODULES)
