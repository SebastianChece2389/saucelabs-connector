'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check').default;

var _regeneratorRuntime = require('babel-runtime/regenerator').default;

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default').default;

exports.__esModule = true;

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _request2 = require('request');

var _request3 = _interopRequireDefault(_request2);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _sauceHost = require('./sauce-host');

var requestPromised = _pify2.default(_request3.default, _pinkie2.default);
var readFile = _pify2.default(_fs2.default.readFile, _pinkie2.default);

var SauceStorage = (function () {
    function SauceStorage(user, pass) {
        _classCallCheck(this, SauceStorage);

        this.user = user;
        this.pass = pass;
    }

    SauceStorage.prototype._request = function _request(params) {
        var result, statusCode, body, message;
        return _regeneratorRuntime.async(function _request$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(requestPromised(params));

                case 2:
                    result = context$2$0.sent;
                    statusCode = result.statusCode;
                    body = result.body;

                    if (!(statusCode !== 200)) {
                        context$2$0.next = 8;
                        break;
                    }

                    message = ['Unexpected response from Sauce Labs.', params.method + ' ' + params.url, 'Response status: ' + statusCode, 'Body: ' + JSON.stringify(body)].join('\n');
                    throw new Error(message);

                case 8:
                    return context$2$0.abrupt('return', body);

                case 9:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SauceStorage.prototype.isFileAvailable = function isFileAvailable(fileName) {
        var params, body, files, result;
        return _regeneratorRuntime.async(function isFileAvailable$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    params = {
                        method: 'GET',
                        uri: 'https://' + _sauceHost.SAUCE_API_HOST + '/rest/v1/storage/' + this.user,
                        headers: { 'Content-Type': 'application/json' },
                        auth: { user: this.user, pass: this.pass }
                    };
                    context$2$0.next = 3;
                    return _regeneratorRuntime.awrap(this._request(params));

                case 3:
                    body = context$2$0.sent;
                    files = JSON.parse(body).files;
                    result = files.filter(function (file) {
                        return file.name === fileName;
                    });
                    return context$2$0.abrupt('return', result.length > 0);

                case 7:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    SauceStorage.prototype.uploadFile = function uploadFile(filePath, fileName) {
        var buffer, params;
        return _regeneratorRuntime.async(function uploadFile$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(readFile('' + filePath + fileName));

                case 2:
                    buffer = context$2$0.sent;
                    params = {
                        method: 'POST',
                        uri: 'https://' + _sauceHost.SAUCE_API_HOST + '/rest/v1/storage/' + this.user + '/' + fileName + '?overwrite=true',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        auth: { user: this.user, pass: this.pass },
                        body: buffer.toString('binary', 0, buffer.length)
                    };
                    context$2$0.next = 6;
                    return _regeneratorRuntime.awrap(this._request(params));

                case 6:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    };

    return SauceStorage;
})();

exports.default = SauceStorage;
module.exports = exports.default;