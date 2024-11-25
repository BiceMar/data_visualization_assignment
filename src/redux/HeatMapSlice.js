import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    heatmapX: "Hours",
    heatmapY: "Days"
};

const HeatMapSlice = createSlice({
    name: 'heatMapPlot',
    initialState: initialState,
    reducers: {
        setHeatmapX: (state, action) => {
            state.heatmapX = action.payload;
        },
        setHeatmapY: (state, action) => {
            state.heatmapY = action.payload;
        }
    },
});

export const { setHeatmapX, setHeatmapY } = HeatMapSlice.actions;

export default HeatMapSlice.reducer;