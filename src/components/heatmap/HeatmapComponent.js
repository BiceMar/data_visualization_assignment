import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import HeatmapD3 from './Heatmap-3d';
import { setHeatmapX, setHeatmapY } from '../../redux/HeatMapSlice';
import { updateSelectedItemInHeatMap, selectAllItems } from '../../redux/DataSetSlice';
import Select from 'react-select';

const HeatmapComponent = () => {
    const data = useSelector(state => state.dataSet.data);
    const selectedItems = useSelector(state => state.dataSet.selectedItems);
    const selectedX = useSelector(state => state.heatMapPlot.heatmapX);
    const selectedY = useSelector(state => state.heatMapPlot.heatmapY);
    const dispatch = useDispatch();
    const svgRef = useRef();
    const heatmapRef = useRef();

    // Dropdown options for axes
    const validOptions = ["Hours", "Days", "Seasons", "Months", "Holiday"];
    const options = validOptions.map(option => ({
        value: option,
        label: option,
    }));

    useEffect(() => {
        console.log('HeatmapComponent mounted.');
    

        // Dispatch selectAllItems to set the initial selection
        dispatch(selectAllItems());
        //heatmapRef.current.render(data, selectedItems, selectedX, selectedY);

        return () => {
            console.log('HeatmapComponent unmounted.');
        };
    }, [dispatch]); 
    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return;

        if (!heatmapRef.current) {
            console.log('Initializing HeatmapD3');
            heatmapRef.current = new HeatmapD3(svgRef.current, (selectedData) => {
                //console.log("Brush data in heatmap:", selectedData);
                dispatch(updateSelectedItemInHeatMap(selectedData));
            });
        }

        // Ensure default selectedItems is set to the full dataset
        console.log('Rendering HeatMap with:', selectedX, selectedY);
        heatmapRef.current.render(data, selectedItems, selectedX, selectedY);
    }, [data, selectedItems, selectedX, selectedY, dispatch]);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2>Heatmap</h2>
            <p>Select variables to visualize the intensity of bike rentals across different time periods.</p>

            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", width: "80%", marginBottom: "10px" }}>
                <div style={{ width: "40%" }}>
                    <p>Select X-Axis</p>
                    <Select
                        options={options}
                        value={options.find(option => option.value === selectedX)}
                        styles={{ container: base => ({ ...base, minWidth: 200 }) }}
                        onChange={(selectedOption) => dispatch(setHeatmapX(selectedOption.value))}
                    />
                </div>
                <div style={{ width: "40%" }}>
                    <p>Select Y-Axis</p>
                    <Select
                        options={options}
                        value={options.find(option => option.value === selectedY)}
                        styles={{ container: base => ({ ...base, minWidth: 200 }) }}
                        onChange={(selectedOption) => dispatch(setHeatmapY(selectedOption.value))}
                    />
                </div>
            </div>
            <button  className="button"
                onClick={() => dispatch(selectAllItems())}
            >
                View All Data in Heatmap
            </button>
            <div style={{ flex: 1, width: "100%" }}>
                <svg ref={svgRef} style={{ width: "100%", height: "100%", overflow: "visible" }}></svg>
            </div>
            
        </div>
    );
};

export default HeatmapComponent;
