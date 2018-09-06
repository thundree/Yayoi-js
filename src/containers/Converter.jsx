import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { iframeSwitch } from '../actions'
import * as tf from '@tensorflow/tfjs'
// import FlipMove from 'react-flip-move'
// import * as util from './Converter.util'
import * as modelConfig from './Converter.config'
import MdlBusyBar from '../components/MdlBusyBar'
import './Converter.css'

class Converter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      isBusy: false,
      imageFile: [],
      imageWidth: 200,
      imageHeight: 200,
      imageSize: 1000000,
      processTime: '0'
    }
    this.handleUpload = this.handleUpload.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handlePredict = this.handlePredict.bind(this)
    this.handleIframe = this.handleIframe.bind(this)
  }

  // ================================================================================
  // React lifecycle functions
  // ================================================================================

  componentDidMount = async () => {
    await this.modelLoad()
    this.setState({ isLoading: false })
  }

  // ================================================================================
  // DNN model functions
  // ================================================================================

  modelLoad = () => {
    return new Promise(async resolve => {
      this.model = await tf.loadModel(modelConfig.modelPath)
      this.model.predict(tf.zeros([1, 32, 32, 1])).dispose()
      resolve()
    })
  }

  modelPredict = input => {
    return new Promise(async resolve => {
      const canvas = document.getElementById('inputCanvas')
      const canvast = document.getElementById('outputCanvas')
      const ctxt = canvast.getContext('2d')
      ctxt.drawImage(
        canvas,
        0,
        0,
        this.state.imageWidth,
        this.state.imageHeight,
        0,
        0,
        this.state.imageWidth * 4,
        this.state.imageHeight * 4
      )
      let fq = document.createElement('canvas')
      fq.width = this.state.imageWidth * 4
      fq.height = this.state.imageHeight * 4
      const fqq = fq.getContext('2d')
      fqq.drawImage(
        canvas,
        0,
        0,
        this.state.imageWidth,
        this.state.imageHeight,
        0,
        0,
        this.state.imageWidth * 4,
        this.state.imageHeight * 4
      )
      ctxt.drawImage(
        fq,
        0,
        0,
        this.state.imageWidth * 4,
        this.state.imageHeight * 4
      )

      resolve()
    })
  }

  // ================================================================================
  // React event handler functions
  // ================================================================================

  handleUpload = event => {
    const data = []
    const tstart = performance.now()
    clearInterval(this.interval)

    for (let i = 0; i < event.target.files.length; i += 1) {
      let dataTemp
      if (
        event.target.files[i] != null &&
        event.target.files[i].size <= this.state.imageSize
      ) {
        dataTemp = URL.createObjectURL(event.target.files[i])
        data.push(dataTemp)
      }
    }

    const tend = performance.now()
    if (data.length > 0) {
      this.setState({
        imageFile: data,
        processTime: Math.floor(tend - tstart).toString() + ' ms',
        isSensing: false
      })
      const image = document.getElementById('inputImage')
      const canvas = document.getElementById('inputCanvas')
      const ctx = canvas.getContext('2d')

      image.onload = () => {
        ctx.clearRect(0, 0, this.state.imageWidth, this.state.imageHeight)
        ctx.drawImage(
          image,
          0,
          0,
          this.state.imageWidth,
          this.state.imageHeight
        )
      }
    } else {
      this.setState({
        imageFile: []
      })
    }
  }

  handleClear = () => {
    this.setState({
      imageFile: []
    })
    const canvas = document.getElementById('inputCanvas')
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, this.state.imageWidth, this.state.imageHeight)
  }

  handlePredict = async () => {
    const tstart = performance.now()
    this.setState({
      isBusy: true
    })
    await this.modelPredict()
    const tend = performance.now()
    this.setState({
      isBusy: false,
      processTime: Math.floor(tend - tstart).toString() + ' ms'
    })
  }

  handleIframe = () => {
    const { iframeSwitch } = this.props
    iframeSwitch(true)
  }

  // ================================================================================
  // React render functions
  // ================================================================================

  renderButton = () => {
    const renderClear = () => {
      if (this.state.imageFile.length > 0) {
        return (
          <button
            className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--primary"
            onClick={this.handleClear}
          >
            Clear Image
          </button>
        )
      }
    }

    const renderTrain = () => {
      if (this.state.imageFile.length > 0) {
        return (
          <button
            className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--primary"
            onClick={this.handlePredict}
          >
            Enlarge Image
          </button>
        )
      }
    }

    return (
      <div>
        <label className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--primary">
          Select Image
          <input
            className="sensor_button_none"
            type="file"
            accept="image/*"
            onChange={this.handleUpload}
            required
          />
        </label>
        {renderClear()}
        {renderTrain()}
      </div>
    )
  }

  renderImage = () => {
    return (
      <div>
        <img
          className="converter_hidden"
          id="inputImage"
          src={this.state.imageFile[0]}
          width={this.state.imageWidth}
          height={this.state.imageHeight}
          alt={this.state.text}
        />
        <canvas
          id="inputCanvas"
          width={this.state.imageWidth}
          height={this.state.imageHeight}
        />
        <canvas
          className="converter_hidden"
          id="tempCanvas"
          width={this.state.imageWidth * 4}
          height={this.state.imageHeight * 4}
        />
      </div>
    )
  }

  renderProceeTime = () => {
    if (this.state.imageFile.length > 0 && this.state.isBusy === false) {
      return (
        <div>
          <div className="mdl-card__actions mdl-card--border sensor_borderline" />
          <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <input
              className="mdl-textfield__input"
              type="text"
              id="processTime_text"
              readOnly
              value={this.state.processTime}
            />
            <label className="mdl-textfield__label" htmlFor="processTime_text">
              Process Time
            </label>
          </div>
        </div>
      )
    } else {
      return null
    }
  }

  renderOutput = () => {
    if (this.state.imageFile.length > 0) {
      return (
        <div className="mdl-cell mdl-cell--7-col">
          <div className="layout-content mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800">
            <canvas
              id="outputCanvas"
              width={this.state.imageWidth * 4}
              height={this.state.imageHeight * 4}
            />
          </div>
        </div>
      )
    }
  }

  render() {
    if (this.state.isLoading) {
      return (
        <div className="mdl-grid">
          <div className="mdl-cell mdl-cell--4-col" />
          <div className="layout-content mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800 mdl-cell mdl-cell--4-col">
            <MdlBusyBar modelText={'Loading...'} />
          </div>
        </div>
      )
    } else {
      return (
        <div className="layout-container mdl-grid">
          <div className="mdl-cell mdl-cell--1-col mdl-cell--hide-tablet mdl-cell--hide-phone" />
          <div className="layout-content mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800 mdl-cell mdl-cell--3-col">
            {this.renderButton()}
            <div className="mdl-card__actions mdl-card--border" />
            {this.renderImage()}
            {this.renderProceeTime()}
            <MdlBusyBar
              modelSwitch={this.state.isBusy}
              modelText={'Processing...'}
              modelBorderUp
            />
          </div>
          {this.renderOutput()}
        </div>
      )
    }
  }
}

Converter.propTypes = {
  iframeSwitch: PropTypes.func.isRequired
}

const mapStateToProps = state => {
  return {}
}

const mapDispatchToProps = dispatch => {
  return {
    iframeSwitch: bindActionCreators(iframeSwitch, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Converter)
