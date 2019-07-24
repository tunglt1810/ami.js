webpackHotUpdateAMI("main",{

/***/ "./src/loaders/loaders.cornerstone.js":
/*!********************************************!*\
  !*** ./src/loaders/loaders.cornerstone.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _loaders_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./loaders.base */ "./src/loaders/loaders.base.js");
/* harmony import */ var _core_core_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/core.utils */ "./src/core/core.utils.js");
/* harmony import */ var _models_models_series__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../models/models.series */ "./src/models/models.series.js");
/* harmony import */ var _models_models_stack__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../models/models.stack */ "./src/models/models.stack.js");
/* harmony import */ var _models_models_frame__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/models.frame */ "./src/models/models.frame.js");
/* harmony import */ var _parsers_parsers_dicom__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../parsers/parsers.dicom */ "./src/parsers/parsers.dicom.js");
/* harmony import */ var _parsers_parsers_mhd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../parsers/parsers.mhd */ "./src/parsers/parsers.mhd.js");
/* harmony import */ var _parsers_parsers_nifti__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../parsers/parsers.nifti */ "./src/parsers/parsers.nifti.js");
/* harmony import */ var _parsers_parsers_nrrd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../parsers/parsers.nrrd */ "./src/parsers/parsers.nrrd.js");
/* harmony import */ var _parsers_parsers_mgh__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../parsers/parsers.mgh */ "./src/parsers/parsers.mgh.js");
/* harmony import */ var cornerstone_core__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! cornerstone-core */ "./node_modules/cornerstone-core/dist/cornerstone.js");
/* harmony import */ var cornerstone_core__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(cornerstone_core__WEBPACK_IMPORTED_MODULE_10__);
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** * Imports ***/
var PAKO = __webpack_require__(/*! pako */ "./node_modules/pako/index.js");














/**
 *
 * It is typically used to load a DICOM image. Use loading manager for
 * advanced usage, such as multiple files handling.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#loader_dicom}
 *
 * @module loaders/volumes
 * @example
 * var files = ['/data/dcm/fruit'];
 *
 * // Instantiate a dicom loader
 * var lDicomoader = new dicom();
 *
 * // load a resource
 * loader.load(
 *   // resource URL
 *   files[0],
 *   // Function when resource is loaded
 *   function(object) {
 *     //scene.add( object );
 *     console.log(object);
 *   }
 * );
 */

var LoadersVolumesCornerstone = function (_LoadersBase) {
    _inherits(LoadersVolumesCornerstone, _LoadersBase);

    function LoadersVolumesCornerstone() {
        _classCallCheck(this, LoadersVolumesCornerstone);

        return _possibleConstructorReturn(this, _LoadersBase.apply(this, arguments));
    }

    LoadersVolumesCornerstone.prototype.loadSequenceGroup = function loadSequenceGroup(url, requests) {
        var _this2 = this;

        window.console.log('load sequence group');
        var fetchSequence = [];

        url.forEach(function (file) {
            fetchSequence.push(_this2.fetch(file, requests));
        });

        return Promise.all(fetchSequence).then(function (rawdata) {
            return _this2.parse(rawdata);
        }).then(function (data) {
            _this2._data.push(data);
            return data;
        }).catch(function (error) {
            if (error === 'Aborted') {
                return;
            }
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        });
    };

    LoadersVolumesCornerstone.prototype.loadSequence = function loadSequence(url, requests) {
        window.console.log('load sequence');
        return cornerstone_core__WEBPACK_IMPORTED_MODULE_10___default.a.loadAndCacheImage(url).then(function (image) {
            window.console.log('loaded by cornerstone', image);
        });
    };

    /**
     * Parse response.
     * response is formated as:
     *    {
     *      url: 'resource url',
     *      buffer: xmlresponse,
     *    }
     * @param {object} response - response
     * @return {promise} promise
     */
    LoadersVolumesCornerstone.prototype.parse = function parse(response) {
        var _this3 = this;

        // emit 'parse-start' event
        this.emit('parse-start', {
            file: response.url,
            time: new Date()
        });

        // give a chance to the UI to update because
        // after the rendering will be blocked with intensive JS
        // will be removed after eventer set up
        if (this._progressBar) {
            this._progressBar.update(0, 100, 'parse', response.url);
        }

        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve(new Promise(function (resolve, reject) {
                    var data = response;

                    if (!Array.isArray(data)) {
                        data = [data];
                    }

                    data.forEach(function (dataset) {
                        _this3._preprocess(dataset);
                    });

                    if (data.length === 1) {
                        data = data[0];
                    } else {
                        // if raw/mhd pair
                        var mhdFile = data.filter(_this3._filterByExtension.bind(null, 'MHD'));
                        var rawFile = data.filter(_this3._filterByExtension.bind(null, 'RAW'));
                        if (data.length === 2 && mhdFile.length === 1 && rawFile.length === 1) {
                            data.url = mhdFile[0].url;
                            data.extension = mhdFile[0].extension;
                            data.mhdBuffer = mhdFile[0].buffer;
                            data.rawBuffer = rawFile[0].buffer;
                        }
                    }

                    var Parser = _this3._parser(data.extension);
                    if (!Parser) {
                        // emit 'parse-error' event
                        _this3.emit('parse-error', {
                            file: response.url,
                            time: new Date(),
                            error: data.filename + 'can not be parsed.'
                        });
                        reject(data.filename + ' can not be parsed.');
                    }

                    // check extension
                    var volumeParser = null;
                    try {
                        volumeParser = new Parser(data, 0);
                    } catch (e) {
                        console.warn(e);
                        // emit 'parse-error' event
                        _this3.emit('parse-error', {
                            file: response.url,
                            time: new Date(),
                            error: e
                        });
                        reject(e);
                    }

                    // create a series
                    var series = new _models_models_series__WEBPACK_IMPORTED_MODULE_2__["default"]();
                    series.rawHeader = volumeParser.rawHeader();
                    // global information
                    series.seriesInstanceUID = volumeParser.seriesInstanceUID();
                    series.transferSyntaxUID = volumeParser.transferSyntaxUID();
                    series.seriesDate = volumeParser.seriesDate();
                    series.seriesDescription = volumeParser.seriesDescription();
                    series.studyDate = volumeParser.studyDate();
                    series.studyDescription = volumeParser.studyDescription();
                    series.numberOfFrames = volumeParser.numberOfFrames();
                    if (!series.numberOfFrames) {
                        series.numberOfFrames = 1;
                    }
                    series.numberOfChannels = volumeParser.numberOfChannels();
                    series.modality = volumeParser.modality();
                    // if it is a segmentation, attach extra information
                    if (series.modality === 'SEG') {
                        // colors
                        // labels
                        // etc.
                        series.segmentationType = volumeParser.segmentationType();
                        series.segmentationSegments = volumeParser.segmentationSegments();
                    }
                    // patient information
                    series.patientID = volumeParser.patientID();
                    series.patientName = volumeParser.patientName();
                    series.patientAge = volumeParser.patientAge();
                    series.patientBirthdate = volumeParser.patientBirthdate();
                    series.patientSex = volumeParser.patientSex();

                    // just create 1 dummy stack for now
                    var stack = new _models_models_stack__WEBPACK_IMPORTED_MODULE_3__["default"]();
                    stack.numberOfChannels = volumeParser.numberOfChannels();
                    stack.pixelRepresentation = volumeParser.pixelRepresentation();
                    stack.pixelType = volumeParser.pixelType();
                    stack.invert = volumeParser.invert();
                    stack.spacingBetweenSlices = volumeParser.spacingBetweenSlices();
                    stack.modality = series.modality;
                    // if it is a segmentation, attach extra information
                    if (stack.modality === 'SEG') {
                        // colors
                        // labels
                        // etc.
                        stack.segmentationType = series.segmentationType;
                        stack.segmentationSegments = series.segmentationSegments;
                    }
                    series.stack.push(stack);
                    // recursive call for each frame
                    // better than for loop to be able
                    // to update dom with "progress" callback
                    setTimeout(_this3.parseFrameClosure(series, stack, response.url, 0, volumeParser, resolve, reject), 0);
                }));
            }, 10);
        });
    };

    LoadersVolumesCornerstone.prototype.parseFrameClosure = function parseFrameClosure(series, stack, url, i, dataParser, resolve, reject) {
        var _this4 = this;

        return function () {
            _this4.parseFrame(series, stack, url, i, dataParser, resolve, reject);
        };
    };

    /**
     * recursive parse frame
     * @param {ModelsSeries} series - data series
     * @param {ModelsStack} stack - data stack
     * @param {string} url - resource url
     * @param {number} i - frame index
     * @param {parser} dataParser - selected parser
     * @param {promise.resolve} resolve - promise resolve args
     * @param {promise.reject} reject - promise reject args
     */


    LoadersVolumesCornerstone.prototype.parseFrame = function parseFrame(series, stack, url, i, dataParser, resolve, reject) {
        var frame = new _models_models_frame__WEBPACK_IMPORTED_MODULE_4__["default"]();
        frame.sopInstanceUID = dataParser.sopInstanceUID(i);
        frame.url = url;
        frame.index = i;
        frame.invert = stack.invert;
        frame.frameTime = dataParser.frameTime(i);
        frame.ultrasoundRegions = dataParser.ultrasoundRegions(i);
        frame.rows = dataParser.rows(i);
        frame.columns = dataParser.columns(i);
        frame.numberOfChannels = stack.numberOfChannels;
        frame.pixelPaddingValue = dataParser.pixelPaddingValue(i);
        frame.pixelRepresentation = stack.pixelRepresentation;
        frame.pixelType = stack.pixelType;
        frame.pixelData = dataParser.extractPixelData(i);
        frame.pixelSpacing = dataParser.pixelSpacing(i);
        frame.spacingBetweenSlices = dataParser.spacingBetweenSlices(i);
        frame.sliceThickness = dataParser.sliceThickness(i);
        frame.imageOrientation = dataParser.imageOrientation(i);
        frame.rightHanded = dataParser.rightHanded();
        stack.rightHanded = frame.rightHanded;
        if (frame.imageOrientation === null) {
            frame.imageOrientation = [1, 0, 0, 0, 1, 0];
        }
        frame.imagePosition = dataParser.imagePosition(i);
        /*
        null ImagePosition should not be handle here
        if (frame.imagePosition === null) {
          frame.imagePosition = [0, 0, i];
        }*/
        frame.dimensionIndexValues = dataParser.dimensionIndexValues(i);
        frame.bitsAllocated = dataParser.bitsAllocated(i);
        frame.instanceNumber = dataParser.instanceNumber(i);
        frame.windowCenter = dataParser.windowCenter(i);
        frame.windowWidth = dataParser.windowWidth(i);
        frame.rescaleSlope = dataParser.rescaleSlope(i);
        frame.rescaleIntercept = dataParser.rescaleIntercept(i);
        // should pass frame index for consistency...
        frame.minMax = dataParser.minMaxPixelData(frame.pixelData);

        // if series.mo
        if (series.modality === 'SEG') {
            frame.referencedSegmentNumber = dataParser.referencedSegmentNumber(i);
        }

        stack.frame.push(frame);

        // update status
        this._parsed = i + 1;
        this._totalParsed = series.numberOfFrames;

        // will be removed after eventer set up
        if (this._progressBar) {
            this._progressBar.update(this._parsed, this._totalParsed, 'parse', url);
        }

        // emit 'parsing' event
        this.emit('parsing', {
            file: url,
            total: this._totalParsed,
            parsed: this._parsed,
            time: new Date()
        });

        if (this._parsed === this._totalParsed) {
            // emit 'parse-success' event
            this.emit('parse-success', {
                file: url,
                total: this._totalParsed,
                parsed: this._parsed,
                time: new Date()
            });

            resolve(series);
        } else {
            setTimeout(this.parseFrameClosure(series, stack, url, this._parsed, dataParser, resolve, reject), 0);
        }
    };

    /**
     * Return parser given an extension
     * @param {string} extension - extension
     * @return {parser} selected parser
     */


    LoadersVolumesCornerstone.prototype._parser = function _parser(extension) {
        var Parser = null;

        switch (extension.toUpperCase()) {
            case 'NII':
            case 'NII_':
                Parser = _parsers_parsers_nifti__WEBPACK_IMPORTED_MODULE_7__["default"];
                break;
            case 'DCM':
            case 'DIC':
            case 'DICOM':
            case 'IMA':
            case '':
                Parser = _parsers_parsers_dicom__WEBPACK_IMPORTED_MODULE_5__["default"];
                break;
            case 'MHD':
                Parser = _parsers_parsers_mhd__WEBPACK_IMPORTED_MODULE_6__["default"];
                break;
            case 'NRRD':
                Parser = _parsers_parsers_nrrd__WEBPACK_IMPORTED_MODULE_8__["default"];
                break;
            case 'MGH':
            case 'MGZ':
                Parser = _parsers_parsers_mgh__WEBPACK_IMPORTED_MODULE_9__["default"];
                break;
            default:
                console.warn('unsupported extension: ' + extension);
                return false;
        }
        return Parser;
    };

    /**
     * Pre-process data to be parsed (find data type and de-compress)
     * @param {*} data
     */


    LoadersVolumesCornerstone.prototype._preprocess = function _preprocess(data) {
        var parsedUrl = _core_core_utils__WEBPACK_IMPORTED_MODULE_1__["default"].parseUrl(data.url);
        // update data
        data.filename = parsedUrl.filename;
        data.extension = parsedUrl.extension;
        data.pathname = parsedUrl.pathname;
        data.query = parsedUrl.query;

        // unzip if extension is '.gz'
        if (data.extension === 'gz') {
            data.gzcompressed = true;
            data.extension = data.filename.split('.gz').shift().split('.').pop();
        } else if (data.extension === 'mgz') {
            data.gzcompressed = true;
            data.extension = 'mgh';
        } else if (data.extension === 'zraw') {
            data.gzcompressed = true;
            data.extension = 'raw';
        } else {
            data.gzcompressed = false;
        }

        if (data.gzcompressed) {
            var decompressedData = PAKO.inflate(data.buffer);
            data.buffer = decompressedData.buffer;
        }
    };

    /**
     * Filter data by extension
     * @param {*} extension
     * @param {*} item
     * @returns Boolean
     */


    LoadersVolumesCornerstone.prototype._filterByExtension = function _filterByExtension(extension, item) {
        if (item.extension.toUpperCase() === extension.toUpperCase()) {
            return true;
        }
        return false;
    };

    return LoadersVolumesCornerstone;
}(_loaders_base__WEBPACK_IMPORTED_MODULE_0__["default"]);

/* harmony default export */ __webpack_exports__["default"] = (LoadersVolumesCornerstone);

/***/ })

})
//# sourceMappingURL=main.1032022462c0103e074f.hot-update.js.map