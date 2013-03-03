function _here ( url ) {
  var selector = ( url ? url : location.href ).split( '#' )[1];
  return ( '#' + ( selector ? selector : '' ) );
}

function _unserialized( key ) {
  return localStorage[ key ] ? JSON.parse( localStorage[ key ] ) : {};
}

function _title ( key ) {
  var inst = Grove.cache[ key ] ? Grove.cache[ key ] : _unserialized( key );
  return ( (inst.model && inst.model.title)?inst.model.title:decodeURI( key.substr(1) ) );
}

function _debounce( key, complete ) {
  var current = Date.now();
  if( ( ! Grove.debounce[ key ] ) || ( ( current - Grove.debounce[ key ] ) > 1000 ) ) {
    complete();
  }
  Grove.debounce[ key ] = current;
}

( function () {
  function Renderer ( key, model, options ) {
    this.key = key;
    this.model = model;
    this.options = options;
  }

  window.Renderer = Renderer;

  Renderer.extend = function () {
    var _$ = function( key, model, options ) { Renderer.call( this, key, model, options ) };
    _$.prototype = new Renderer();
    return _$;
  };

  Renderer.prototype.render = function () {
    throw Error( 'attempt to render virtual superclass' );
  }

  Renderer.prototype.unrender = function () {
  };

  Renderer.prototype.rerender = function () {
    this.render();
  };
} ) ();

// Grove object - represents "all the pages" we can view
( function () {

  window.Grove = {
    cache: {},
    templates: {},
    renderers: {},
    currentRenderer: null,
    currentModel: null,
    currentKey: null,
    submode: 0,
    mode: 0,
    debounce: {},
    search: '',
    search_direction: 0,
    getPage: function( key, parameters, callback ) {
      var item = localStorage[ key ];
      if( ! item ) {
        return callback( _error( 'item not found (' + key + ')', 'warning' ) );
      }
    },
    render_fragment: function ( fragment ) {
      Grove.get_instance( fragment, function( err, data ) {

        if( err ) {
          return err.raise();
        }
        data.render();
      } );
    },
    get_instance: function ( key, callback ) {
      var _renderer = Grove.cache[ key ];

      if( ! _renderer ) {
        var instance;
        if( localStorage[ key ] ) {
          instance = JSON.parse( localStorage[ key ] );
        } else {
          instance = { model: { } };
        }

        var rname = instance.renderer ? instance.renderer : 'TextRenderer';
        if( ! Grove.renderers[ rname ] ) {
          return callback( new _error( 'Unregistered renderer (' + rname + ')', 'error' ) );
        }
        
        _renderer =  new Grove.renderers[ rname ]( key, instance.model );
        _renderer.created = Date.now();
        Grove.cache[ key ] = _renderer;
      }

      _renderer.lastRead = Date.now();
      Grove.currentRenderer = _renderer;
      Grove.currentModel = _renderer.model;
      Grove.currentKey = key;
      callback( null, _renderer );
    },
    save_current: function () {
      if( Grove.currentRenderer ) {
        Grove.currentRenderer.save();
        delete Grove.cache[ Grove.currentKey ];
      }
    },
    go: function( target ) {
      Grove.currentRenderer.unrender();
      if( '#' == target.substr(0,1) ) {
        Grove.render_fragment( target );
      } else {
        location.href = target;
      }
    },
    delete_page: function ( key ) {
      if( Grove.cache[ key ] ) {
        delete Grove.cache[ key ];
      }
      if( localStorage[ key ] ) {
        var value = JSON.parse( localStorage[ key ] );
        if( value.model && ( value.model.locked !== true ) ) {
          delete localStorage[ key ];
          Grove.go( '#PageList' );
        } else {
          ( new _error( 'You cannot delete this page', 'warning' ) ).raise();
        }
      }
    },
    text_keys: function( event ) {
    },
    key_commands: {
      0: {
        9: 'indent',
        112: function () { location.href = '#Help'; },
        118: function () { _debounce( 'insertDate', function () { document.execCommand( 'insertText', false, (new Date()).toLocaleDateString() + ' ' ); } ) },
        119: function () { _debounce( 'insertTime', function () { document.execCommand( 'insertText', false, (new Date()).toLocaleTimeString() + ' ' ); } ) }
      },
      1: {
        9: 'outdent'
      },
      2: {
        65: 'selectAll',
        66: 'bold',
        68: 'forwardDelete',
        72: 'delete',
// CTRL-H
        73: 'italic',
// CTRL-K
// CTRL-M
// CTRL-N
        79: function() { Grove.go( '#PageList' ); },
// CTRL-P ?
// CTRL-Q
        83: function () { Grove.save_current() },
// CTRL-T
        85: 'underline',
        87: function () { console.log( 'select this word' ) },
        88: 'cut',
        89: 'redo',
        90: 'undo'
      },
      4: { // alt mode
        65: function () { $('#alert').html( 'w00t!' ); }
      },
      6: { // Emacsish submode`
        65: function () { _debounce( 'esol', function () { console.log( 'emacs beginning of line' ) } ) },
        69: function () { _debounce( 'eeol', function () { console.log( 'emacs end of line' ); } ) },
        85: function () { _debounce( 'eselect', function () { console.log( 'emacs select' ) } ) }
      },
      7: { // Link Submode
        65: function () {
          var selection = window.getSelection();
          if( selection.anchorNode.parentNode.href ) {
            selection.selectAllChildren( selection.anchorNode.parentNode );
          }
        },
        76: function () {
          var target = window.getSelection().toString();
          if( ' ' == target.substr(-1) ) {
            target = target.substr(0, target.length);
          }
          if( ( 'http://' != target.substr( 0, 7 ) ) &&
              ( 'https://' != target.substr( 0, 8 ) ) ) {
            target = '#' + encodeURI( target );
          }
          if( '#' !== target ) {
            document.execCommand( 'createLink', true, target );
          }
        },
        85: function () { document.execCommand( 'unlink' ); }
      },
      8: { // Justify Submode
        67: 'justifyCenter',
        70: 'justifyFull',
        76: 'justifyLeft',
        82: 'justifyRight',
      },
      9: { // unused commands submode
        65: 'backColor',
        66: 'foreColor',
        69: 'fontName',
        70: 'fontSize',
        71: 'insertHorizontalRule',
        72: 'insertOrderedList',
        73: 'insertUnorderedList',
        79: 'removeFormat',
        80: 'strikeThrough',
        81: 'subscript',
        82: 'superscript'
      }
    },
    key_gates: {
      2: {
        69: 6, // Ctrl-E (emacsish)
        74: 8, // Ctrl-J (justify)
        76: 7, // Ctrl-L (links)
        82: 9  // Ctrl-R (search mode)
      }
    },
    initialize: function ( callback ) {
      function mode_change ( event ) {
        var new_mode = 0;
        var new_submode = Grove.submode;

        if( event.shiftKey ) {
          new_mode |= 1;
        }

        if( event.ctrlKey ) {
          new_mode |= 2;
        }

        if( event.altKey ) {
          new_mode |= 4;
        }

        if( Grove.mode != new_mode ) {
          Grove.mode = new_mode;
        }

        if( new_submode > 5 ) {
          if( 0 == Grove.mode ) {
            new_submode = 0;
          }
        } else {
          new_submode = [ 0, 1, 2, 3, 4, 5, 4, 5 ][ Grove.mode ];

          if( Grove.key_gates[ new_submode ] && Grove.key_gates[ new_submode ][ event.which ] ) { 
            event.preventDefault();
            new_submode = Grove.key_gates[ new_submode ][ event.which ];
          }
        }

        if( Grove.submode != new_submode ) {
          Grove.submode = new_submode;
          console.log( 'new submode: ' + new_submode );
        }
      }

      // Read template source and compile
      $('.template').each( function( index, value ) {
        Grove.templates[ value.id ] = Handlebars.compile( value.innerHTML );
      } );

      // Create Renderer Subclasses
      Grove.renderers.TextRenderer = Renderer.extend();
      Grove.renderers.TextRenderer.prototype.render = function () {
        $( '#content' ).html( Grove.templates.TextRenderer( { title: _title( this.key ), body: (this.model && this.model.body)?this.model.body:'<p>Just start typing...</p>' } ) );
        $( '.editable' ).attr( 'contenteditable', true );
        $( '#bodybox' ).on( 'click', function( event ) {
          if( event.target && event.target.href ) {
            Grove.go( event.target.href );
          }
        } );
        $(document).on( 'keyup', function( event ) {
          var bodybox = $('#bodybox');
          if( bodybox.html() && ( 0 == bodybox.html().length ) ) {
            $('#bodybox').append('<p/>');
            document.getSelection().extend( document.getElementById('bodybox').firstChild, 0 );
          }
          mode_change( event );
        } );
        $(document).on( 'keydown', function( event ) {          
          if( 9 != Grove.submode ) {
            Grove.search = '';
          }
          if( Grove.submode > 5 ) {
            event.preventDefault();
          }
          if( 9 == Grove.submode ) {
            // search mode
            event.preventDefault();
            Grove.search += String.fromCharCode( event.which );            
//            ( new _error(Grove.search, 'success', 'Searching For:' ) ).raise();
            window.find( Grove.search );
          } else if( Grove.key_commands[ Grove.submode ] && Grove.key_commands[ Grove.submode ][ event.which ] ) {
            event.preventDefault();
            var selected = Grove.key_commands[ Grove.submode ][ event.which ];
            switch( typeof selected ) {
            case 'function':
              selected( event );
              break;
            case 'string':
              document.execCommand( selected );
              break;
            }
          }
          mode_change( event );
        } );
        $(document).on( 'copy', function( event ) {
          if( 7 == Grove.submode ) {
            var selection = window.getSelection();
            if( selection.anchorNode.parentNode.href ) {
              event.preventDefault();
              event.originalEvent.clipboardData.setData('text/plain', selection.anchorNode.parentNode.href );
            }
          }
          Grove.submode = 0;
        } );
        $(document).on( 'paste', function( event ) {
          if( 7 == Grove.submode ) {
            event.preventDefault();
            var selection = window.getSelection();
            if( selection.anchorNode.parentNode.href ) {
              selection.anchorNode.parentNode.href = event.originalEvent.clipboardData.getData( 'text/plain' );
            }
            Grove.subode = 0;
          }
        } );
      };
      
      Grove.renderers.TextRenderer.prototype.save = function () {
        if( $('#title').html() != decodeURI( this.key.substr(1) ) ) {
          this.model.title = decodeURI( $('#title').html() );
        }

        this.model.body = $('#bodybox').html();

        localStorage[ this.key ] = JSON.stringify( { model: this.model } );
      };
      Grove.renderers.TextRenderer.prototype.unrender = function () {
        this.save();
      };

      Grove.renderers.RedirectRenderer = Renderer.extend();
      Grove.renderers.RedirectRenderer.prototype.render = function () {
        location.hash = this.model;
      };

      Grove.renderers.PageListRenderer = Renderer.extend();
      Grove.renderers.PageListRenderer.prototype.render = function () {
        var renderList = [];
        _.each( _.keys( localStorage ), function( key ) {
          var value = JSON.parse( localStorage[ key ] );
          if( ( ! value.renderer ) && value.model ) {
            renderList.push( { href: key, title: _title( key ) } );
          } 
        } );
        $('#content').html( Grove.templates.PageList( { pages: _.sortBy( renderList, function(item) {return item.title;}) } ) );
      };

      Grove.renderers.OptionsRenderer = Renderer.extend();
      Grove.renderers.OptionsRenderer.prototype.render = function () {
        var now = new Date();
        function pad( item ){ return ( item < 10 ? '0' : '' ) + item; }
        var filename = 'svb_' + ( [
          pad( now.getUTCFullYear() ),
          pad( now.getUTCMonth() ),
          pad( now.getUTCDate() ),
          pad( now.getUTCHours() ),
          pad( now.getUTCMinutes() ),
          pad( now.getUTCSeconds() )
        ].join( '_' ) ) + '.json'
        var t = {};
        _.each( _.keys( localStorage ), function( key ) {
          t[ key ] = JSON.parse( localStorage[ key ] );
        } );
        var bare = JSON.parse( localStorage['#'] ).model;
        $( '#content' ).html( Grove.templates.Options( {
          schema: pad( JSON.parse( localStorage['$'] ).schema ),
          barehref: bare,
          baretext: _title( bare ),
          filename: filename
        } ) );
        $( '#backup' ).attr( 'href', "data:text/plain," + encodeURIComponent( JSON.stringify( t ) ) );
        var fileObject;
        $('#restore').on( 'change', function( event ) {
          fileObject = event.originalEvent.target.files[0];
          var reader = new FileReader();
          reader.onload = function ( event ) {
            if( event.target.result ) {
              try {
                var deserialized = JSON.parse( event.target.result );
                localStorage.clear();
                Grove.cache = {};
                _.each( _.keys( deserialized ), function( key ) {
                  localStorage[ key ] = JSON.stringify( deserialized[ key ] );
                } );
              } catch( e ) {
                ( new _error( e, 'error' ) ).raise();
              }
            }
          };
          reader.readAsText( fileObject );
        } );
      };


      // Update old groves
      if( ! localStorage[ '#Options' ] ) {
        localStorage[ '#Options' ] = JSON.stringify( { renderer: "OptionsRenderer" } );
      }
      if( localStorage[ '$' ] ) {
        Grove.options = JSON.parse( localStorage[ '$' ] );
        callback && callback();
      } else {
        if( localStorage[ '#' ] ) {
          _.each( _.keys( localStorage ), function( key ) {
            var _old = JSON.parse( localStorage[ key ] );
            var _new;
            if( _old.redirect ) {
              _new = { renderer: 'RedirectRenderer', model: _old.redirect };
            } else {
              _new = { model: { body: _old.content } };
              if( _old.title ) {
                _new.model.title = _old.title;
              }
            }
            localStorage[ key ] = JSON.stringify( _new );
          } );
          localStorage[ '$' ] = JSON.stringify( {
            schema: 1
          } );
          callback && callback();
        } else {
          _.each( _.keys( localStorage ), function ( key ) {
            delete localStorage[ key ];
          } );

          ( new _endpoint( 'defaulto.json' ) ).get( function( err, data ) {
            if( err ) {
              return err.raise();
            }

            _.each( data, function( content, key ) {
              localStorage[ key ] = JSON.stringify( content );
            } );

            localStorage[ '$' ] = JSON.stringify( {
              schema: 1
            } );

            callback && callback();
          } );
        }
      }
    }
  };
} )( );

$(document).ready( function() {
  Grove.initialize( function () {

    $(window).on( 'hashchange', function( event ) {
      Grove.go( _here( event.originalEvent.newURL ) );
    } );
    Grove.render_fragment( _here( ) );
  } );
} );