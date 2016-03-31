define(['exports', 'aurelia-dependency-injection', './auth-context'], function (exports, _aureliaDependencyInjection, _authContext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AuthorizeInterceptor = undefined;

  var _aureliaDependencyInjection2 = _interopRequireDefault(_aureliaDependencyInjection);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var AuthorizeInterceptor = (_dec = (0, _aureliaDependencyInjection2.default)(_authContext.AuthContext), _dec(_class = function () {
    function AuthorizeInterceptor(authContext) {
      _classCallCheck(this, AuthorizeInterceptor);

      this.authContext = authContext;
    }

    AuthorizeInterceptor.prototype.request = function request(_request) {
      var _this = this;

      var resource = this.authContext.adal.getResourceForEndpoint(_request.url);
      if (resource == null) {
        return Promise.resolve(_request);
      }
      this.logger.debug('retrieved resource for endpoint "' + _request.url + '":');
      this.logger.debug(resource);

      var tokenStored = this.authContext.adal.getCachedToken(resource);
      if (tokenStored) {
        this.logger.debug('retrieved token for resource:');
        this.logger.debug(tokenStored);

        _request.headers.append('Authorization', 'Bearer ' + tokenStored);

        return Promise.resolve(_request);
      }

      if (this.authContext.adal.loginInProgress()) {
        this.logger.warn('login already started.');

        return Promise.reject('login already started');
      }

      var isEndpoint = this.authContext.adal.config && Object.keys(this.authContext.adal.config.endpoints).some(function (endpointUrl) {
        return _request.url.indexOf(endpointUrl) > -1;
      });
      if (isEndpoint) {
        return new Promise(function (resolve, reject) {
          _this.logger.info('acquiring token...');
          _this.authContext.adal.acquireToken(resource, function (error, token) {
            if (error) {
              _this.logger.error('acquiring token failed');
              reject(error);
            } else {
              _this.logger.info('token acquired');
              _this.logger.debug(token);
              _request.headers.set('Authorization', 'Bearer ' + token);
              resolve(_request);
            }
          });
        });
      } else {
        return Promise.resolve(_request);
      }
    };

    AuthorizeInterceptor.prototype.responseError = function responseError(rejection) {
      var notAuthorized = rejection && rejection.status === 401;

      if (notAuthorized) {
        this.logger.warn('Not authorized');

        var resource = this.authContext.adal.getResourceForEndpoint(rejection.config.url);
        this.authContext.adal.clearCacheForResource(resource);
      }

      return rejection;
    };

    return AuthorizeInterceptor;
  }()) || _class);
  exports.AuthorizeInterceptor = AuthorizeInterceptor;
});