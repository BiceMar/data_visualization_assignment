import { createSlice } from '@reduxjs/toolkit'

export const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0
  },
  reducers: {
    updateAnObject: (state, action) => {
      return {...state, value: state.value + action.payload}
    },
    addValueToAnArray: (state, action) => {
      return [...state, action.payload]
    },
    updateAnArray: state => {
      return state.map(item=>{
        if (itemData.index === action.payload.index) {
          return {...itemData, keyToUpdate: action.payload.valueToUpdate};
        } else {
          return itemData;
        }
      })
    },
  }
})

// Action creators are generated for each case reducer function
export const { updateAnObject, addValueToAnArray, updateAnArray } = counterSlice.actions

export default counterSlice.reducer