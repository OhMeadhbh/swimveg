( function () {
  function _endpoint( url ) {
    this.url = url;
  }

  window._endpoint = _endpoint;

  _endpoint.prototype.get = function( complete, dataType ) {
    this.query( 'GET', null, complete, dataType );
  };

  _endpoint.prototype.query = function( method, body, complete, dataType ) {
    $.ajax( {
      context: this,
      url: this.url,
      async: true,
      contentType: ( body ? 'application/json' : undefined ),
      dataType: ( dataType ? dataType : 'json' ),
      type: method.toUpperCase(),
      timeout: 10000,
      success: function( data, textStatus, jqXHR ) {
        complete( null, data );
      },
      error: function ( jqXHR, textStatus, errorThrown ) {
        var e = new _error( 'I got a "' + errorThrown + '" when trying to ' + method.toUpperCase() + ' ' + this.url, null, textStatus );
        console.log( e.toString() );
        complete( e, null );
      }
    } );
  }
} ) ();
