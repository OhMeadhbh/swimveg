// swimveg.js
// Copyright (c) 2009-2012 Meadhbh S. Hamrick, All Rights Reserved
//
// License at https://raw.github.com/OhMeadhbh/swimveg/master/LICENSE

var props = require( 'node-props' );
var app   = require( 'nodify-app' );

props.read( function ( properties ) {
  ( new app( properties ) ).init( function( server ) {
    server.listen();
  } );
} );