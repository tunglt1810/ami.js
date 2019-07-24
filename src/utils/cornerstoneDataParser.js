import UtilsCore from "../core/core.utils";
import * as OpenJPEG from "OpenJPEG.js/dist/openJPEG-DynamicMemory-browser";
import {RLEDecoder} from "../decoders/decoders.rle";
import {getNumberString, getNumberValue, getValue} from "./index";

export default class CornerstoneDataParser {
    constructor(metaData) {
        this.metaData = metaData;
    }

    /**
     * Series instance UID (0020,000e)
     *
     * @return {String}
     */
    seriesInstanceUID() {
        return getValue(this.metaData['0020000e']);
    }

    /**
     * Study instance UID (0020,000d)
     *
     * @return {String}
     */
    studyInstanceUID() {
        return getValue(this.metaData['0020000d']);
    }

    /**
     * Get modality (0008,0060)
     *
     * @return {String}
     */
    modality() {
        return getValue(this.metaData['00080060']);
    }

    /**
     * Segmentation type (0062,0001)
     *
     * @return {String}
     */
    segmentationType() {
        return getValue(this.metaData['00620001']);
    }

    /**
     * Segmentation segments
     * -> Sequence of segments (0062,0002)
     *   -> Recommended Display CIELab
     *   -> Segmentation Code
     *   -> Segment Number (0062,0004)
     *   -> Segment Label (0062,0005)
     *   -> Algorithm Type (0062,0008)
     *
     * @return {*}
     */
    segmentationSegments() {
        let segmentationSegments = [];
        let segmentSequence = this.metaData['00620002'];
        console.log('parse segmentSequence', segmentSequence);

        if (!segmentSequence) {
            return segmentationSegments;
        }
        try {
            for (let i = 0; i < segmentSequence.items.length; i++) {
                let recommendedDisplayCIELab = this._recommendedDisplayCIELab(segmentSequence.items[i]);
                let segmentationCode = this._segmentationCode(segmentSequence.items[i]);
                let segmentNumber = getNumberValue(segmentSequence.items[i].dataSet['00620004']);
                let segmentLabel = getValue(segmentSequence.items[i].dataSet['00620005']);
                let segmentAlgorithmType = getValue(segmentSequence.items[i].dataSet['00620008']);

                segmentationSegments.push({
                    recommendedDisplayCIELab,
                    segmentationCodeDesignator: segmentationCode['segmentationCodeDesignator'],
                    segmentationCodeValue: segmentationCode['segmentationCodeValue'],
                    segmentationCodeMeaning: segmentationCode['segmentationCodeMeaning'],
                    segmentNumber,
                    segmentLabel,
                    segmentAlgorithmType,
                });
            }
        } catch (e) {
            console.error(e);
        }

        return segmentationSegments;
    }

    /**
     * Segmentation code
     * -> Code designator (0008,0102)
     * -> Code value (0008,0200)
     * -> Code Meaning Type (0008,0104)
     *
     * @param {*} segment
     *
     * @return {*}
     */
    _segmentationCode(segment) {
        let segmentationCodeDesignator = 'unknown';
        let segmentationCodeValue = 'unknown';
        let segmentationCodeMeaning = 'unknown';
        let element = segment.dataSet['00082218'];

        if (element && element.items && element.items.length > 0) {
            segmentationCodeDesignator = getValue(element.items[0].dataSet['00080102']);
            segmentationCodeValue = getValue(element.items[0].dataSet['00080100']);
            segmentationCodeMeaning = getValue(element.items[0].dataSet['00080104']);
        }

        return {
            segmentationCodeDesignator,
            segmentationCodeValue,
            segmentationCodeMeaning,
        };
    }

    /**
     * Recommended display CIELab
     *
     * @param {*} segment
     *
     * @return {*}
     */
    _recommendedDisplayCIELab(segment) {
        if (!segment.dataSet['0062000d']) {
            return null;
        }

        let offset = segment.dataSet['0062000d'].dataOffset;
        let length = segment.dataSet['0062000d'].length;
        let byteArray = segment.dataSet.byteArray.slice(offset, offset + length);

        // https://www.dabsoft.ch/dicom/3/C.10.7.1.1/
        let CIELabScaled = new Uint16Array(length / 2);
        for (let i = 0; i < length / 2; i++) {
            CIELabScaled[i] = (byteArray[2 * i + 1] << 8) + byteArray[2 * i];
        }

        let CIELabNormalized = [
            (CIELabScaled[0] / 65535) * 100,
            (CIELabScaled[1] / 65535) * 255 - 128,
            (CIELabScaled[2] / 65535) * 255 - 128,
        ];

        return CIELabNormalized;
    }

    /**
     * Raw dataset
     *
     * @return {*}
     */
    rawHeader() {
        return this.metaData;
    }

    /**
     * SOP Instance UID
     *
     * @param {*} frameIndex
     *
     * @return {*}
     */
    sopInstanceUID(frameIndex = 0) {
        return this._findStringEverywhere('2005140f', '00080018', frameIndex);
    }

    /**
     * Transfer syntax UID
     *
     * @return {*}
     */
    transferSyntaxUID() {
        return getValue(this.metaData['00020010']);
    }

    /**
     * Study date
     *
     * @return {*}
     */
    studyDate() {
        return getValue(this.metaData['00080020']);
    }

    /**
     * Study description
     *
     * @return {*}
     */
    studyDescription() {
        return getValue(this.metaData['00081030']);
    }

    /**
     * Series date
     *
     * @return {*}
     */
    seriesDate() {
        return getValue(this.metaData['00080021']);
    }

    /**
     * Series description
     *
     * @return {*}
     */
    seriesDescription() {
        return getValue(this.metaData['0008103e']);
    }

    /**
     * Patient name
     *
     * @return {*}
     */
    patientName() {
        return getValue(this.metaData['00100010']);
    }

    /**
     * Patient ID
     *
     * @return {*}
     */
    patientID() {
        return getValue(this.metaData['00100020']);
    }

    /**
     * Patient birthdate
     *
     * @return {*}
     */
    patientBirthdate() {
        return getValue(this.metaData['00100030']);
    }

    /**
     * Patient sex
     *
     * @return {*}
     */
    patientSex() {
        return getValue(this.metaData['00100040']);
    }

    /**
     * Patient age
     *
     * @return {*}
     */
    patientAge() {
        return getValue(this.metaData['00101010']);
    }

    /**
     * Photometric interpretation
     *
     * @return {*}
     */
    photometricInterpretation() {
        return getValue(this.metaData['00280004']);
    }

    planarConfiguration() {
        let planarConfiguration = this.metaData.uint16('00280006');

        if (typeof planarConfiguration === 'undefined') {
            planarConfiguration = null;
        }

        return planarConfiguration;
    }

    samplesPerPixel() {
        return this.metaData.uint16('00280002');
    }

    numberOfFrames() {
        let numberOfFrames = getNumberValue(this.metaData['00280008']);

        // need something smarter!
        if (typeof numberOfFrames === 'undefined') {
            numberOfFrames = null;
        }

        return numberOfFrames;
    }

    numberOfChannels() {
        let numberOfChannels = 1;
        let photometricInterpretation = this.photometricInterpretation();

        if (
            !(
                photometricInterpretation !== 'RGB' &&
                photometricInterpretation !== 'PALETTE COLOR' &&
                photometricInterpretation !== 'YBR_FULL' &&
                photometricInterpretation !== 'YBR_FULL_422' &&
                photometricInterpretation !== 'YBR_PARTIAL_422' &&
                photometricInterpretation !== 'YBR_PARTIAL_420' &&
                photometricInterpretation !== 'YBR_RCT'
            )
        ) {
            numberOfChannels = 3;
        }

        // make sure we return a number! (not a string!)
        return numberOfChannels;
    }

    invert() {
        let photometricInterpretation = this.photometricInterpretation();
        return photometricInterpretation === 'MONOCHROME1';
    }

    imageOrientation(frameIndex = 0) {
        // expect frame index to start at 0!
        let imageOrientation = this._findStringEverywhere('00209116', '00200037', frameIndex);

        // format image orientation ('1\0\0\0\1\0') to array containing 6 numbers
        if (imageOrientation) {
            // make sure we return a number! (not a string!)
            // might not need to split (floatString + index)
            imageOrientation = imageOrientation.split('\\').map(UtilsCore.stringToNumber);
        }

        return imageOrientation;
    }

    referencedSegmentNumber(frameIndex = 0) {
        let referencedSegmentNumber = -1;
        let referencedSegmentNumberElement = this._findInGroupSequence('52009230', '0062000a', frameIndex,);

        if (referencedSegmentNumberElement !== null) {
            referencedSegmentNumber = getNumberValue(referencedSegmentNumberElement['0062000b']);
        }

        return referencedSegmentNumber;
    }

    pixelAspectRatio() {
        let pixelAspectRatio = [
            this.metaData.intString('00280034', 0),
            this.metaData.intString('00280034', 1),
        ];

        // need something smarter!
        if (typeof pixelAspectRatio[0] === 'undefined') {
            pixelAspectRatio = null;
        }

        // make sure we return a number! (not a string!)
        return pixelAspectRatio;
    }

    imagePosition(frameIndex = 0) {
        let imagePosition = this._findStringEverywhere('00209113', '00200032', frameIndex);

        // format image orientation ('1\0\0\0\1\0') to array containing 6 numbers
        if (imagePosition) {
            // make sure we return a number! (not a string!)
            imagePosition = imagePosition.split('\\').map(UtilsCore.stringToNumber);
        }

        return imagePosition;
    }

    instanceNumber(frameIndex = 0) {
        let instanceNumber = null;
        // first look for frame!
        // per frame functionnal group sequence
        let perFrameFunctionnalGroupSequence = this.metaData['52009230'];

        if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
            if (perFrameFunctionnalGroupSequence.items[frameIndex].dataSet['2005140f']) {
                let planeOrientationSequence =
                    perFrameFunctionnalGroupSequence.items[frameIndex].dataSet['2005140f'].items[0]
                        .dataSet;
                instanceNumber = getNumberValue(planeOrientationSequence['00200013']);
            } else {
                instanceNumber = getNumberValue(this.metaData['00200013']);

                if (typeof instanceNumber === 'undefined') {
                    instanceNumber = null;
                }
            }
        } else {
            // should we default to undefined??
            // default orientation
            instanceNumber = getNumberValue(this.metaData['00200013']);

            if (typeof instanceNumber === 'undefined') {
                instanceNumber = null;
            }
        }

        return instanceNumber;
    }

    pixelSpacing(frameIndex = 0) {
        // expect frame index to start at 0!
        let pixelSpacing = this._findStringEverywhere('00289110', '00280030', frameIndex);

        if (pixelSpacing === null) {
            pixelSpacing = getValue(this.metaData['00181164']);

            if (typeof pixelSpacing === 'undefined') {
                pixelSpacing = null;
            }
        }

        if (pixelSpacing) {
            const splittedSpacing = pixelSpacing.split('\\');
            if (splittedSpacing.length !== 2) {
                console.error(`DICOM spacing format is not supported (could not split string on "\\"): ${pixelSpacing}`);
                pixelSpacing = null;
            } else {
                pixelSpacing = splittedSpacing.map(UtilsCore.stringToNumber);
            }
        }

        return pixelSpacing;
    }

    ultrasoundRegions(frameIndex = 0) {
        const sequence = this.metaData['00186011'];

        if (!sequence || !sequence.items) {
            return [];
        }

        const ultrasoundRegions = [];

        sequence.items.forEach(item => {
            ultrasoundRegions.push({
                x0: item.dataSet.uint32('00186018'),
                y0: item.dataSet.uint32('0018601a'),
                x1: item.dataSet.uint32('0018601c'),
                y1: item.dataSet.uint32('0018601e'),
                axisX: item.dataSet.int32('00186020') || null, // optional
                axisY: item.dataSet.int32('00186022') || null, // optional
                unitsX: this._getUnitsName(item.dataSet.uint16('00186024')),
                unitsY: this._getUnitsName(item.dataSet.uint16('00186026')),
                deltaX: item.dataSet.double('0018602c'),
                deltaY: item.dataSet.double('0018602e'),
            });
        });

        return ultrasoundRegions;
    }

    frameTime(frameIndex = 0) {
        let frameIncrementPointer = getNumberString(this.metaData['00280009']);
        let frameRate = getNumberString(this.metaData['00082144']);
        let frameTime;

        if (typeof frameIncrementPointer === 'number') {
            frameIncrementPointer = frameIncrementPointer.toString(16);
            frameTime = getNumberString(this.metaData['0018' + frameIncrementPointer]);
        }

        if (typeof frameTime === 'undefined' && typeof frameRate === 'number') {
            frameTime = 1000 / frameRate;
        }

        if (typeof frameTime === 'undefined') {
            frameTime = null;
        }

        return frameTime;
    }

    rows(frameIndex = 0) {
        let rows = getNumberString(this.metaData['00280010']);

        if (typeof rows === 'undefined') {
            rows = null;
            // print warning at least...
        }

        return rows;
    }

    columns(frameIndex = 0) {
        let columns = getNumberString(this.metaData['00280011']);

        if (typeof columns === 'undefined') {
            columns = null;
            // print warning at least...
        }

        return columns;
    }

    pixelType(frameIndex = 0) {
        // 0 integer, 1 float
        // dicom only support integers
        return 0;
    }

    pixelRepresentation(frameIndex = 0) {
        return getNumberValue(this.metaData['00280103']);
    }

    pixelPaddingValue(frameIndex = 0) {
        let padding = getNumberValue(this.metaData['00280120']);

        if (typeof padding === 'undefined') {
            padding = null;
        }

        return padding;
    }

    bitsAllocated(frameIndex = 0) {
        // expect frame index to start at 0!
        return getNumberString(this.metaData['00280100']);
    }

    highBit(frameIndex = 0) {
        // expect frame index to start at 0!
        return getNumberValue(this.metaData['00280102']);
    }

    rescaleIntercept(frameIndex = 0) {
        return this._findFloatStringInFrameGroupSequence('00289145', '00281052', frameIndex);
    }

    rescaleSlope(frameIndex = 0) {
        return this._findFloatStringInFrameGroupSequence('00289145', '00281053', frameIndex);
    }

    windowCenter(frameIndex = 0) {
        return this._findFloatStringInFrameGroupSequence('00289132', '00281050', frameIndex);
    }

    windowWidth(frameIndex = 0) {
        return this._findFloatStringInFrameGroupSequence('00289132', '00281051', frameIndex);
    }

    sliceThickness(frameIndex = 0) {
        return this._findFloatStringInFrameGroupSequence('00289110', '00180050', frameIndex);
    }

    spacingBetweenSlices(frameIndex = 0) {
        let spacing = getNumberValue(this.metaData['00180088']);

        if (typeof spacing === 'undefined') {
            spacing = null;
        }

        return spacing;
    }

    dimensionIndexValues(frameIndex = 0) {
        let dimensionIndexValues = null;

        // try to get it from enhanced MR images
        // per-frame functionnal group sequence
        let perFrameFunctionnalGroupSequence = this.metaData['52009230'];

        if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
            let frameContentSequence =
                perFrameFunctionnalGroupSequence.items[frameIndex].dataSet['00209111'];
            if (frameContentSequence !== undefined && frameContentSequence !== null) {
                frameContentSequence = frameContentSequence.items[0].dataSet;
                let dimensionIndexValuesElt = frameContentSequence['00209157'];
                if (dimensionIndexValuesElt !== undefined && dimensionIndexValuesElt !== null) {
                    // /4 because UL
                    let nbValues = dimensionIndexValuesElt.length / 4;
                    dimensionIndexValues = [];

                    for (let i = 0; i < nbValues; i++) {
                        dimensionIndexValues.push(getNumberValue(frameContentSequence['00209157'], i));
                    }
                }
            }
        }

        return dimensionIndexValues;
    }

    inStackPositionNumber(frameIndex = 0) {
        let inStackPositionNumber = null;

        // try to get it from enhanced MR images
        // per-frame functionnal group sequence
        let perFrameFunctionnalGroupSequence = this.metaData['52009230'];

        if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
            // NOT A PHILIPS TRICK!
            let philipsPrivateSequence =
                perFrameFunctionnalGroupSequence.items[frameIndex].dataSet['00209111'].items[0]
                    .dataSet;
            inStackPositionNumber = getNumberValue(philipsPrivateSequence['00209057']);
        } else {
            inStackPositionNumber = null;
        }

        return inStackPositionNumber;
    }

    stackID(frameIndex = 0) {
        let stackID = null;

        // try to get it from enhanced MR images
        // per-frame functionnal group sequence
        let perFrameFunctionnalGroupSequence = this.metaData['52009230'];

        if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
            // NOT A PHILIPS TRICK!
            let philipsPrivateSequence =
                perFrameFunctionnalGroupSequence.items[frameIndex].dataSet['00209111'].items[0]
                    .dataSet;
            stackID = getNumberValue(philipsPrivateSequence['00209056']);
        } else {
            stackID = null;
        }

        return stackID;
    }

    extractPixelData(frameIndex = 0) {
        // decompress
        let decompressedData = this._decodePixelData(frameIndex);

        let numberOfChannels = this.numberOfChannels();

        if (numberOfChannels > 1) {
            return this._convertColorSpace(decompressedData);
        } else {
            return decompressedData;
        }
    }

    //
    // private methods
    //

    _findInGroupSequence(sequence, subsequence, index) {
        let functionalGroupSequence = this.metaData[sequence];

        if (typeof functionalGroupSequence !== 'undefined') {
            let inSequence = functionalGroupSequence.items[index].dataSet[subsequence];

            if (typeof inSequence !== 'undefined') {
                return inSequence.items[0].dataSet;
            }
        }

        return null;
    }

    _findStringInGroupSequence(sequence, subsequence, tag, index) {
        // index = 0 if shared!!!
        let dataSet = this._findInGroupSequence(sequence, subsequence, index);

        if (dataSet !== null) {
            return getValue(dataSet[tag]);
        }

        return null;
    }

    _findStringInFrameGroupSequence(subsequence, tag, index) {
        return (
            this._findStringInGroupSequence('52009229', subsequence, tag, 0) ||
            this._findStringInGroupSequence('52009230', subsequence, tag, index)
        );
    }

    _findStringEverywhere(subsequence, tag, index) {
        let targetString = this._findStringInFrameGroupSequence(subsequence, tag, index);
        // PET MODULE
        if (targetString === null) {
            const petModule = '00540022';
            targetString = this._findStringInSequence(petModule, tag);
        }

        if (targetString === null) {
            targetString = getValue(this.metaData[tag]);
        }

        if (typeof targetString === 'undefined') {
            targetString = null;
        }

        return targetString;
    }

    _findStringInSequence(sequenceTag, tag, index) {
        const sequence = this.metaData[sequenceTag];

        let targetString;
        if (sequence) {
            targetString = getValue(sequence.items[0].dataSet[tag]);
        }

        if (typeof targetString === 'undefined') {
            targetString = null;
        }

        return targetString;
    }

    _findFloatStringInGroupSequence(sequence, subsequence, tag, index) {
        let dataInGroupSequence = getNumberValue(this.metaData[tag]);

        // try to get it from enhanced MR images
        // per-frame functionnal group
        if (typeof dataInGroupSequence === 'undefined') {
            dataInGroupSequence = this._findInGroupSequence(sequence, subsequence, index);

            if (dataInGroupSequence !== null) {
                return getNumberValue(dataInGroupSequence[tag]);
            }
        }

        return dataInGroupSequence;
    }

    _findFloatStringInFrameGroupSequence(subsequence, tag, index) {
        return (
            this._findFloatStringInGroupSequence('52009229', subsequence, tag, 0) ||
            this._findFloatStringInGroupSequence('52009230', subsequence, tag, index)
        );
    }

    _decodePixelData(frameIndex = 0) {
        // if compressed..?
        let transferSyntaxUID = this.transferSyntaxUID();
        console.log('transfer syntax uid', transferSyntaxUID);
        // find compression scheme
        if (
            transferSyntaxUID === '1.2.840.10008.1.2.4.90' ||
            // JPEG 2000 Lossless
            transferSyntaxUID === '1.2.840.10008.1.2.4.91'
        ) {
            // JPEG 2000 Lossy
            return this._decodeJ2K(frameIndex);
        } else if (
            transferSyntaxUID === '1.2.840.10008.1.2.5'
        // decodeRLE
        ) {
            return this._decodeRLE(frameIndex);
        } else if (
            transferSyntaxUID === '1.2.840.10008.1.2.4.57' ||
            // JPEG Lossless, Nonhierarchical (Processes 14)
            transferSyntaxUID === '1.2.840.10008.1.2.4.70'
        ) {
            // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
            return this._decodeJPEGLossless(frameIndex);
        } else if (
            transferSyntaxUID === '1.2.840.10008.1.2.4.50' ||
            // JPEG Baseline lossy process 1 (8 bit)
            transferSyntaxUID === '1.2.840.10008.1.2.4.51'
        ) {
            // JPEG Baseline lossy process 2 & 4 (12 bit)
            return this._decodeJPEGBaseline(frameIndex);
        } else if (
            transferSyntaxUID === '1.2.840.10008.1.2' ||
            // Implicit VR Little Endian
            transferSyntaxUID === '1.2.840.10008.1.2.1'
        ) {
            // Explicit VR Little Endian
            return this._decodeUncompressed(frameIndex);
        } else if (transferSyntaxUID === '1.2.840.10008.1.2.2') {
            // Explicit VR Big Endian
            let frame = this._decodeUncompressed(frameIndex);
            // and sawp it!
            return this._swapFrame(frame);
        } else {
            throw {
                error: `no decoder for transfer syntax ${transferSyntaxUID}`,
            };
        }
    }

    // github.com/chafey/cornerstoneWADOImageLoader/blob/master/src/imageLoader/wadouri/getEncapsulatedImageFrame.js
    framesAreFragmented() {
        const numberOfFrames = getValue(this.metaData['00280008']);
        const pixelDataElement = this.metaData['7fe00010'];

        return numberOfFrames !== pixelDataElement.fragments.length;
    }

    getEncapsulatedImageFrame(frameIndex) {
        if (
            this.metaData['7fe00010'] &&
            this.metaData['7fe00010'].basicOffsetTable.length
        ) {
            // Basic Offset Table is not empty
            return DicomParser.readEncapsulatedImageFrame(
                this.metaData,
                this.metaData['7fe00010'],
                frameIndex,
            );
        }

        if (this.framesAreFragmented()) {
            // Basic Offset Table is empty
            return DicomParser.readEncapsulatedImageFrame(
                this.metaData,
                this.metaData['7fe00010'],
                frameIndex,
                DicomParser.createJPEGBasicOffsetTable(this.metaData, this.metaData['7fe00010']),
            );
        }

        return DicomParser.readEncapsulatedPixelDataFromFragments(
            this.metaData,
            this.metaData['7fe00010'],
            frameIndex,
        );
    }

    // used if OpenJPEG library isn't loaded (OHIF/image-JPEG2000 isn't supported and can't parse some images)
    _decodeJpx(frameIndex = 0) {
        const jpxImage = new Jpx();
        // https://github.com/OHIF/image-JPEG2000/issues/6
        // It currently returns either Int16 or Uint16 based on whether the codestream is signed or not.
        jpxImage.parse(this.getEncapsulatedImageFrame(frameIndex));

        if (jpxImage.componentsCount !== 1) {
            throw new Error(
                'JPEG2000 decoder returned a componentCount of ${componentsCount}, when 1 is expected',
            );
        }

        if (jpxImage.tiles.length !== 1) {
            throw new Error('JPEG2000 decoder returned a tileCount of ${tileCount}, when 1 is expected');
        }

        return jpxImage.tiles[0].items;
    }

    _decodeOpenJPEG(frameIndex = 0) {
        const encodedPixelData = this.getEncapsulatedImageFrame(frameIndex);
        const bytesPerPixel = this.bitsAllocated(frameIndex) <= 8 ? 1 : 2;
        const signed = this.pixelRepresentation(frameIndex) === 1;
        const dataPtr = openJPEG._malloc(encodedPixelData.length);

        openJPEG.writeArrayToMemory(encodedPixelData, dataPtr);

        // create param outpout
        const imagePtrPtr = openJPEG._malloc(4);
        const imageSizePtr = openJPEG._malloc(4);
        const imageSizeXPtr = openJPEG._malloc(4);
        const imageSizeYPtr = openJPEG._malloc(4);
        const imageSizeCompPtr = openJPEG._malloc(4);
        const ret = openJPEG.ccall(
            'jp2_decode',
            'number',
            ['number', 'number', 'number', 'number', 'number', 'number', 'number'],
            [
                dataPtr,
                encodedPixelData.length,
                imagePtrPtr,
                imageSizePtr,
                imageSizeXPtr,
                imageSizeYPtr,
                imageSizeCompPtr,
            ],
        );
        const imagePtr = openJPEG.getValue(imagePtrPtr, '*');

        if (ret !== 0) {
            console.log('[opj_decode] decoding failed!');
            openJPEG._free(dataPtr);
            openJPEG._free(imagePtr);
            openJPEG._free(imageSizeXPtr);
            openJPEG._free(imageSizeYPtr);
            openJPEG._free(imageSizePtr);
            openJPEG._free(imageSizeCompPtr);

            return;
        }

        // Copy the data from the EMSCRIPTEN heap into the correct type array
        const length =
            openJPEG.getValue(imageSizeXPtr, 'i32') *
            openJPEG.getValue(imageSizeYPtr, 'i32') *
            openJPEG.getValue(imageSizeCompPtr, 'i32');
        const src32 = new Int32Array(openJPEG.HEAP32.buffer, imagePtr, length);
        let pixelData;

        if (bytesPerPixel === 1) {
            if (Uint8Array.from) {
                pixelData = Uint8Array.from(src32);
            } else {
                pixelData = new Uint8Array(length);
                for (let i = 0; i < length; i++) {
                    pixelData[i] = src32[i];
                }
            }
        } else if (signed) {
            if (Int16Array.from) {
                pixelData = Int16Array.from(src32);
            } else {
                pixelData = new Int16Array(length);
                for (let i = 0; i < length; i++) {
                    pixelData[i] = src32[i];
                }
            }
        } else if (Uint16Array.from) {
            pixelData = Uint16Array.from(src32);
        } else {
            pixelData = new Uint16Array(length);
            for (let i = 0; i < length; i++) {
                pixelData[i] = src32[i];
            }
        }

        openJPEG._free(dataPtr);
        openJPEG._free(imagePtrPtr);
        openJPEG._free(imagePtr);
        openJPEG._free(imageSizePtr);
        openJPEG._free(imageSizeXPtr);
        openJPEG._free(imageSizeYPtr);
        openJPEG._free(imageSizeCompPtr);

        return pixelData;
    }

    // from cornerstone
    _decodeJ2K(frameIndex = 0) {
        if (typeof OpenJPEG === 'undefined') {
            // OpenJPEG decoder not loaded
            return this._decodeJpx(frameIndex);
        }

        if (!openJPEG) {
            openJPEG = OpenJPEG();
            if (!openJPEG || !openJPEG._jp2_decode) {
                // OpenJPEG failed to initialize
                return this._decodeJpx(frameIndex);
            }
        }

        return this._decodeOpenJPEG(frameIndex);
    }

    _decodeRLE(frameIndex = 0) {
        const bitsAllocated = this.bitsAllocated(frameIndex);
        const planarConfiguration = this.planarConfiguration();
        const columns = this.columns();
        const rows = this.rows();
        const samplesPerPixel = this.samplesPerPixel(frameIndex);
        const pixelRepresentation = this.pixelRepresentation(frameIndex);

        // format data for the RLE decoder
        const imageFrame = {
            pixelRepresentation,
            bitsAllocated,
            planarConfiguration,
            columns,
            rows,
            samplesPerPixel,
        };

        const pixelData = DicomParser.readEncapsulatedPixelDataFromFragments(
            this.metaData,
            this.metaData['7fe00010'],
            frameIndex,
        );

        const decoded = RLEDecoder(imageFrame, pixelData);
        return decoded.pixelData;
    }

    // from cornerstone
    _decodeJPEGLossless(frameIndex = 0) {
        let encodedPixelData = this.getEncapsulatedImageFrame(frameIndex);
        let pixelRepresentation = this.pixelRepresentation(frameIndex);
        let bitsAllocated = this.bitsAllocated(frameIndex);
        let byteOutput = bitsAllocated <= 8 ? 1 : 2;
        let decoder = new Jpeg.lossless.Decoder();
        let decompressedData = decoder.decode(
            encodedPixelData.buffer,
            encodedPixelData.byteOffset,
            encodedPixelData.length,
            byteOutput,
        );

        if (pixelRepresentation === 0) {
            if (byteOutput === 2) {
                return new Uint16Array(decompressedData.buffer);
            } else {
                // untested!
                return new Uint8Array(decompressedData.buffer);
            }
        } else {
            return new Int16Array(decompressedData.buffer);
        }
    }

    _decodeJPEGBaseline(frameIndex = 0) {
        let encodedPixelData = this.getEncapsulatedImageFrame(frameIndex);
        let rows = this.rows(frameIndex);
        let columns = this.columns(frameIndex);
        let bitsAllocated = this.bitsAllocated(frameIndex);
        let jpegBaseline = new JpegBaseline();
        jpegBaseline.parse(encodedPixelData);

        if (bitsAllocated === 8) {
            return jpegBaseline.getData(columns, rows);
        } else if (bitsAllocated === 16) {
            return jpegBaseline.getData16(columns, rows);
        }
    }

    _decodeUncompressed(frameIndex = 0) {
        let pixelRepresentation = this.pixelRepresentation(frameIndex);
        let bitsAllocated = this.bitsAllocated(frameIndex);
        let pixelDataElement = this.metaData['7fe00010'];
        let pixelDataOffset = pixelDataElement.dataOffset;
        let numberOfChannels = this.numberOfChannels();
        let numPixels = this.rows(frameIndex) * this.columns(frameIndex) * numberOfChannels;
        let frameOffset = 0;
        let buffer = this.metaData.byteArray.buffer;

        if (pixelRepresentation === 0 && bitsAllocated === 8) {
            // unsigned 8 bit
            frameOffset = pixelDataOffset + frameIndex * numPixels;
            return new Uint8Array(buffer, frameOffset, numPixels);
        } else if (pixelRepresentation === 0 && bitsAllocated === 16) {
            // unsigned 16 bit
            frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
            return new Uint16Array(buffer, frameOffset, numPixels);
        } else if (pixelRepresentation === 1 && bitsAllocated === 16) {
            // signed 16 bit
            frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
            return new Int16Array(buffer, frameOffset, numPixels);
        } else if (pixelRepresentation === 0 && bitsAllocated === 32) {
            // unsigned 32 bit
            frameOffset = pixelDataOffset + frameIndex * numPixels * 4;
            return new Uint32Array(buffer, frameOffset, numPixels);
        } else if (pixelRepresentation === 0 && bitsAllocated === 1) {
            let newBuffer = new ArrayBuffer(numPixels);
            let newArray = new Uint8Array(newBuffer);

            frameOffset = pixelDataOffset + frameIndex * numPixels;
            let index = 0;

            let bitStart = frameIndex * numPixels;
            let bitEnd = frameIndex * numPixels + numPixels;

            let byteStart = Math.floor(bitStart / 8);
            let bitStartOffset = bitStart - byteStart * 8;
            let byteEnd = Math.ceil(bitEnd / 8);

            let targetBuffer = new Uint8Array(buffer, pixelDataOffset);

            for (let i = byteStart; i <= byteEnd; i++) {
                while (bitStartOffset < 8) {
                    switch (bitStartOffset) {
                        case 0:
                            newArray[index] = targetBuffer[i] & 0x0001;
                            break;
                        case 1:
                            newArray[index] = (targetBuffer[i] >>> 1) & 0x0001;
                            break;
                        case 2:
                            newArray[index] = (targetBuffer[i] >>> 2) & 0x0001;
                            break;
                        case 3:
                            newArray[index] = (targetBuffer[i] >>> 3) & 0x0001;
                            break;
                        case 4:
                            newArray[index] = (targetBuffer[i] >>> 4) & 0x0001;
                            break;
                        case 5:
                            newArray[index] = (targetBuffer[i] >>> 5) & 0x0001;
                            break;
                        case 6:
                            newArray[index] = (targetBuffer[i] >>> 6) & 0x0001;
                            break;
                        case 7:
                            newArray[index] = (targetBuffer[i] >>> 7) & 0x0001;
                            break;
                        default:
                            break;
                    }

                    bitStartOffset++;
                    index++;
                    // if return..
                    if (index >= numPixels) {
                        return newArray;
                    }
                }
                bitStartOffset = 0;
            }
        }
    }

    _interpretAsRGB(photometricInterpretation) {
        const rgbLikeTypes = ['RGB', 'YBR_RCT', 'YBR_ICT', 'YBR_FULL_422'];

        return rgbLikeTypes.indexOf(photometricInterpretation) !== -1;
    }

    _convertColorSpace(uncompressedData) {
        let rgbData = null;
        let photometricInterpretation = this.photometricInterpretation();
        let planarConfiguration = this.planarConfiguration();

        const interpretAsRGB = this._interpretAsRGB(photometricInterpretation);
        if (interpretAsRGB && planarConfiguration === 0) {
            // ALL GOOD, ALREADY ORDERED
            // planar or non planar planarConfiguration
            rgbData = uncompressedData;
        } else if (interpretAsRGB && planarConfiguration === 1) {
            if (uncompressedData instanceof Int8Array) {
                rgbData = new Int8Array(uncompressedData.length);
            } else if (uncompressedData instanceof Uint8Array) {
                rgbData = new Uint8Array(uncompressedData.length);
            } else if (uncompressedData instanceof Int16Array) {
                rgbData = new Int16Array(uncompressedData.length);
            } else if (uncompressedData instanceof Uint16Array) {
                rgbData = new Uint16Array(uncompressedData.length);
            } else {
                const error = new Error(`unsuported typed array: ${uncompressedData}`);
                throw error;
            }

            let numPixels = uncompressedData.length / 3;
            let rgbaIndex = 0;
            let rIndex = 0;
            let gIndex = numPixels;
            let bIndex = numPixels * 2;
            for (let i = 0; i < numPixels; i++) {
                rgbData[rgbaIndex++] = uncompressedData[rIndex++]; // red
                rgbData[rgbaIndex++] = uncompressedData[gIndex++]; // green
                rgbData[rgbaIndex++] = uncompressedData[bIndex++]; // blue
            }
        } else if (photometricInterpretation === 'YBR_FULL') {
            if (uncompressedData instanceof Int8Array) {
                rgbData = new Int8Array(uncompressedData.length);
            } else if (uncompressedData instanceof Uint8Array) {
                rgbData = new Uint8Array(uncompressedData.length);
            } else if (uncompressedData instanceof Int16Array) {
                rgbData = new Int16Array(uncompressedData.length);
            } else if (uncompressedData instanceof Uint16Array) {
                rgbData = new Uint16Array(uncompressedData.length);
            } else {
                const error = new Error(`unsuported typed array: ${uncompressedData}`);
                throw error;
            }

            // https://github.com/chafey/cornerstoneWADOImageLoader/blob/master/src/decodeYBRFull.js
            let nPixels = uncompressedData.length / 3;
            let ybrIndex = 0;
            let rgbaIndex = 0;
            for (let i = 0; i < nPixels; i++) {
                let y = uncompressedData[ybrIndex++];
                let cb = uncompressedData[ybrIndex++];
                let cr = uncompressedData[ybrIndex++];
                rgbData[rgbaIndex++] = y + 1.402 * (cr - 128); // red
                rgbData[rgbaIndex++] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128); // green
                rgbData[rgbaIndex++] = y + 1.772 * (cb - 128); // blue
                // rgbData[rgbaIndex++] = 255; //alpha
            }
        } else {
            const error = new Error(
                `photometric interpolation not supported: ${photometricInterpretation}`,
            );
            throw error;
        }

        return rgbData;
    }

    /**
     * Swap bytes in frame.
     */
    _swapFrame(frame) {
        // swap bytes ( if 8bits (1byte), nothing to swap)
        let bitsAllocated = this.bitsAllocated();

        if (bitsAllocated === 16) {
            for (let i = 0; i < frame.length; i++) {
                frame[i] = this._swap16(frame[i]);
            }
        } else if (bitsAllocated === 32) {
            for (let i = 0; i < frame.length; i++) {
                frame[i] = this._swap32(frame[i]);
            }
        }

        return frame;
    }

    _getUnitsName(value) {
        const units = {
            0: 'none',
            1: 'percent',
            2: 'dB',
            3: 'cm',
            4: 'seconds',
            5: 'hertz',
            6: 'dB/seconds',
            7: 'cm/sec',
            8: 'cm2',
            9: 'cm2/sec',
            10: 'cm3',
            11: 'cm3/sec',
            12: 'degrees',
        };

        return units.hasOwnProperty(value) ? units[value] : 'none';
    }

    minMaxPixelData(pixelData = []) {
        let minMax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
        let numPixels = pixelData.length;
        for (let index = 0; index < numPixels; index++) {
            let spv = pixelData[index];
            minMax[0] = Math.min(minMax[0], spv);
            minMax[1] = Math.max(minMax[1], spv);
        }

        return minMax;
    }
}
