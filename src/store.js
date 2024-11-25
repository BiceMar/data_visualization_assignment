import { configureStore } from '@reduxjs/toolkit'
import dataSetReducer from './redux/DataSetSlice'
import scatterPlotReducer from './redux/ScatterPlotSlice'
import heatMapReducer from './redux/HeatMapSlice'
export default configureStore({
  reducer: {
    dataSet: dataSetReducer,
    scatterPlot: scatterPlotReducer,
    heatMapPlot: heatMapReducer
    }
})

