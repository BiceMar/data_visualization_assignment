import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ScatterplotD3 from './Scatterplot-d3'; 
import { setScatterX, setScatterY } from '../../redux/ScatterPlotSlice';
import { updateSelectedItem } from '../../redux/DataSetSlice';
import Select from 'react-select';

const ScatterplotComponent = () => {
    const data = useSelector(state => state.dataSet.data); 
    const selectedX = useSelector(state => state.scatterPlot.selectedX);
    const selectedY = useSelector(state => state.scatterPlot.selectedY);
    const selectedItemsInHeatMap = useSelector(state => state.dataSet.selectedItemsInHeatMap);
    const dispatch = useDispatch();
    const svgRef = useRef();
    const scatterplotRef = useRef();

    // Dropdown options for axes
    const validOptions = ["Date", "RentedBikeCount", "Hour", "Temperature", "Humidity", "WindSpeed", "Visibility", "DewPointTemperature", "SolarRadiation", "Rainfall", "Snowfall"];
    const options = validOptions.map(option => ({
        value: option,
        label: option,
    }));

    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return;

        if (!scatterplotRef.current) {
            console.log('Initializing ScatterplotD3');
            scatterplotRef.current = new ScatterplotD3(
                svgRef.current, 
                (selectedData) => {
                    //console.log('Selected data in scatterplot:', selectedData);
                    dispatch(updateSelectedItem(selectedData)); // Dispatch action to set selected items
                }
            );
        }

        console.log('Rendering Scatterplot with:', selectedX, selectedY);
        scatterplotRef.current.render(data, selectedX, selectedY);
    }, [data, selectedX, selectedY, dispatch]);

    useEffect(() => {
        if (!scatterplotRef.current || !selectedItemsInHeatMap) return;
        //console.log('Highlighting elements:', selectedItemsInHeatMap);
        scatterplotRef.current.highLightElements(selectedItemsInHeatMap);
    }, [selectedItemsInHeatMap]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Scatterplot</h2>
            <p>Select two variables to visualize their relationship in the scatterplot</p>
   
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '50%', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p>Select X-Axis</p>
                    <Select
                        id="x-axis-select"
                        options={options}
                        value={options.find(option => option.value === selectedX)}
                        onChange={(selectedOption) => dispatch(setScatterX(selectedOption.value))}
                        styles={{ container: base => ({ ...base, width: '100%' }) }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p>Select Y-Axis</p>
                    <Select
                        id="y-axis-select"
                        options={options}
                        value={options.find(option => option.value === selectedY)}
                        onChange={(selectedOption) => dispatch(setScatterY(selectedOption.value))}
                        styles={{ container: base => ({ ...base, width: '100%' }) }}
                    />
                </div>
            </div>

            <svg ref={svgRef} style={{ width: "100%", height: "80%", padding: "0px", overflow: "visible" }}></svg>
        </div>
    );
};

export default ScatterplotComponent;
