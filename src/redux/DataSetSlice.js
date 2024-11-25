import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Papa from "papaparse";

export const getSeoulBikeData = createAsyncThunk('seoulBikeData/fetchData', async () => {
    const response = await fetch('data/SeoulBikeData.csv');
    const responseText = await response.text();
    console.log("loaded file length:" + responseText.length);
    const responseJson = Papa.parse(responseText, { header: true, dynamicTyping: true });
    return responseJson.data.map((item, i) => { return { ...item, index: i }; });
});

export const dataSetSlice = createSlice({
    name: 'dataSet',
    initialState: {
        data: [],
        selectedItems: [],
        selectedItemsInHeatMap: []
    },
    reducers: {
        updateSelectedItem: (state, action) => {
            state.selectedItems = action.payload; // Store selected items in state
        },
        updateSelectedItemInHeatMap: (state, action) => {
            state.selectedItemsInHeatMap = action.payload; // Store selected items in state
        },
        selectAllItems: (state) => {
            state.selectedItems = state.data; // Set selectedItems to all data
        }
    },
    extraReducers: builder => {
        builder.addCase(getSeoulBikeData.fulfilled, (state, action) => {
            state.data = action.payload; 
        });
    }
});

export const { updateSelectedItem } = dataSetSlice.actions;
export const { updateSelectedItemInHeatMap } = dataSetSlice.actions;
export const { selectAllItems } = dataSetSlice.actions;

export default dataSetSlice.reducer;