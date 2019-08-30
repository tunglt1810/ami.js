/** * Imports ***/

// const PAKO = require('pako');

import LoadersBase from './loaders.base';
import ModelsSeries from '../models/models.series';
import ModelsStack from '../models/models.stack';
import ModelsFrame from '../models/models.frame';

import {CornerstoneDataParser} from "../utils";
import * as Promise from 'bluebird';
Promise.config({ cancellation: true });
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
export default class LoadersVolumesCornerstone extends LoadersBase {
    load(url, requests, cornerstone) {
        this.cornerstone = cornerstone;
        return super.load(url, requests);
    }

    loadSequenceGroup(url, requests) {
        window.console.log('load sequence group cornerstone');
        const fetchSequence = [];
        const loader = this.cornerstone;
        url.forEach(file => {
            fetchSequence.push(loader.loadAndCacheImage(url));
        });

        return Promise.all(fetchSequence)
            .then(rawdata => {
                return this.parse(rawdata);
            })
            .then(data => {
                this._data.push(data);
                return data;
            })
            .catch(function (error) {
                if (error === 'Aborted') {
                    return;
                }
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
    }

    loadSequence(url, requests) {
        window.console.log('load sequence cornerstone');
        return this.cornerstone.loadAndCacheImage(url)
            .then(image => {
                window.console.log('loaded by cornerstone', image);
                return this.parse(image);
            })
            .then(data => {
                this._data.push(data);
                return data;
            })
            .catch(function (error) {
                if (error === 'Aborted') {
                    return;
                }
                window.console.log('oops... something went wrong...');
                window.console.log(error);
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
    parse(response) {
        const cornerstoneImage = response;
        // emit 'parse-start' event
        this.emit('parse-start', {
            file: response.url,
            time: new Date(),
        });

        // give a chance to the UI to update because
        // after the rendering will be blocked with intensive JS
        // will be removed after eventer set up
        if (this._progressBar) {
            this._progressBar.update(0, 100, 'parse', response.url);
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(
                    new Promise((resolve, reject) => {
                        const {imageId} = cornerstoneImage;
                        const {metaData} = this.cornerstone;
                        const metaDataAll = metaData.get('all', imageId);
                        console.log('get all metaData', metaDataAll);
                        const dataParser = new CornerstoneDataParser(metaDataAll);

                        let volumeParser = null;
                        // create a series
                        let series = new ModelsSeries();
                        // series.rawHeader = volumeParser.rawHeader();
                        // global information
                        series.seriesInstanceUID = dataParser.seriesInstanceUID();
                        series.transferSyntaxUID = dataParser.transferSyntaxUID();

                        series.seriesDate = dataParser.seriesDate();
                        series.seriesDescription = dataParser.seriesDescription();
                        series.studyDate = dataParser.studyDate();
                        series.studyDescription = dataParser.studyDescription();
                        series.numberOfFrames = dataParser.numberOfFrames();
                        if (!series.numberOfFrames) {
                            series.numberOfFrames = 1;
                        }

                        series.numberOfChannels = dataParser.numberOfChannels();
                        series.modality = dataParser.modality();
                        if (series.modality === 'SEG') {
                            series.segmentationType = dataParser.segmentationType();
                            // series.segmentationSegments = dataParser.segmentationSegments();
                        }

                        series.patientID = dataParser.patientID();
                        series.patientName = dataParser.patientName();
                        series.patientAge = dataParser.patientAge();
                        series.patientBirthdate = dataParser.patientBirthdate();
                        series.patientSex = dataParser.patientSex();

                        console.log('create series', series);

                        let stack = new ModelsStack();
                        stack.pixelRepresentation = dataParser.pixelRepresentation();
                        stack.pixelType = dataParser.pixelType();
                        stack.invert = dataParser.invert();
                        stack.spacingBetweenSlices = dataParser.spacingBetweenSlices();
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
                        setTimeout(
                            this.parseFrameClosure(series, stack, response.url, 0, dataParser, resolve, reject, cornerstoneImage),
                            0
                        )
                    })
                );
            }, 10);
        });
    }

    parseFrameClosure(series, stack, url, i, dataParser, resolve, reject, cornerstoneImage) {
        return () => {
            this.parseFrame(series, stack, url, i, dataParser, resolve, reject, cornerstoneImage);
        };
    }

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
    parseFrame(series, stack, url, i, dataParser, resolve, reject, cornerstoneImage) {
        let frame = new ModelsFrame();
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
        frame.pixelData = cornerstoneImage.getPixelData();
        frame.pixelSpacing = dataParser.pixelSpacing(i);
        frame.spacingBetweenSlices = dataParser.spacingBetweenSlices(i);
        frame.sliceThickness = dataParser.sliceThickness(i);
        frame.imageOrientation = dataParser.imageOrientation(i);
        // frame.rightHanded = dataParser.rightHanded();
        // stack.rightHanded = frame.rightHanded;
        if (frame.imageOrientation === null) {
            frame.imageOrientation = [1, 0, 0, 0, 1, 0];
        }
        frame.imagePosition = dataParser.imagePosition(i);
        /*
        null ImagePosition should not be handle here
        if (frame.imagePosition === null) {
          frame.imagePosition = [0, 0, i];
        }*/
        // frame.dimensionIndexValues = dataParser.dimensionIndexValues(i);
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
            time: new Date(),
        });

        if (this._parsed === this._totalParsed) {
            // emit 'parse-success' event
            this.emit('parse-success', {
                file: url,
                total: this._totalParsed,
                parsed: this._parsed,
                time: new Date(),
            });

            resolve(series);
        } else {
            setTimeout(
                this.parseFrameClosure(series, stack, url, this._parsed, dataParser, resolve, reject),
                0
            );
        }
    }
}
