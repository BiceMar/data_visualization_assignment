import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedX: "Temperature",
    selectedY: "RentedBikeCount",
};

const scatterPlotSlice = createSlice({
    name: 'scatterPlot',
    initialState: initialState,
    reducers: {
        setScatterX: (state, action) => {
            state.selectedX = action.payload;
        },
        setScatterY: (state, action) => {
            state.selectedY = action.payload;
        },
        resetScatter: (state) => {
            state.selectedX = "Temperature";
            state.selectedY = "RentedBikeCount";
        },
    },
});

export const { setScatterX, setScatterY, resetScatter } = scatterPlotSlice.actions;

export default scatterPlotSlice.reducer;