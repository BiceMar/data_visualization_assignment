import { configureStore } from '@reduxjs/toolkit'
import dataSetReducer from './redux/DataSetSlice'
export default configureStore({
  reducer: {
    dataSet: dataSetReducer,
    }
})