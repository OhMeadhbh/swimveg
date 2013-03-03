( function () {
  function _error( text, errno, severity, url ) {
    this.text = text;
    this.errno = errno;
    this.severity = severity;
    this.url = url;
    this.success = false;
  }

  window._error = _error;

  _error.prototype.toString = function() {
    return ( "%" + this.severity + ( this.errno ? "(" + this.errno + ")" : '' ) + '; ' + ( this.text ? this.text : '' ) );
  };

  _error.prototype.toHTML = function() {
    var output = ( this.text ? this.text : '' ) + ( this.errno ? ' (' + this.errno + ')' : '' );
    if( this.url ) {
      output = '<a href="' + this.url + '">' + output + '</a>';
    }
    return output;
  };

  _error.prototype._severity = function ( s ) {
    var i = s ? s : ( this.severity ? this.severity : 'info' );
    return i.substr(0,1).toUpperCase() + i.substr(1);
  };

  _error.prototype.raise = function () {
    $('#alert').html( '<div class="alert alert-' + ( this.severity ? this.severity : 'info' ) + '">' +
                      '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                      '<strong>' + this._severity() + '!</strong> ' + this.toHTML() + '</div>' );
  };

} ) ();