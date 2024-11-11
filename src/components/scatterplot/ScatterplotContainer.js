import './Scatterplot.css'
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux'

import ScatterplotD3 from './Scatterplot-d3';
import { getSeoulBikeData } from "../../redux/DataSetSlice"; // Importa la funzione per caricare i dati

function ScatterplotContainer(){
    const dataSetSlice = useSelector(state =>state.dataSet)
    const dispatch = useDispatch();

    const xAttribute= "Date"
    const yAttribute= "RentedBikeCount"
    // every time the component re-render
    useEffect(()=>{
        console.log("ScatterplotContainer RENDERED");
        console.log(dataSetSlice);
    }); // if no dependencies, useEffect is called at each re-render

    const divContainerRef=useRef(null);
    const scatterplotD3Ref = useRef(null)
    const getCharSize = function(){
        // Make the scatterplot as big as the screen
        let width = window.innerWidth;
        let height = window.innerHeight;
        return {width: width, height: height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect [] called once the component did mount");
        dispatch(getSeoulBikeData());
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getCharSize()});
        scatterplotD3Ref.current = scatterplotD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("ScatterplotContainer useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect with dependency [dataSetSlice,dispatch], called each time matrixData changes...");
        const scatterplotD3 = scatterplotD3Ref.current;

        //const handleOnClick = function(cellData){
        //    dispatch(updateSelectedItem(cellData));
        //}
        //const handleOnMouseEnter = function(cellData){
        //    dispatch(updateHoveredCell(cellData))
        //}
        //const handleOnMouseLeave = function(){
        //    dispatch(updateHoveredCell({}))
        //}
//
        //const controllerMethods={
        //    handleOnClick,
        //    handleOnMouseEnter,
        //    handleOnMouseLeave
        //}
        // Parse the date attribute if it's in the format "00-00-0000"
            const parsedDataSet = dataSetSlice.map(item => ({
                ...item,
                [xAttribute]: item[xAttribute] ? new Date(item[xAttribute].split('/').reverse().join('/')) : null
            }));
    
            scatterplotD3.renderScatterplot(parsedDataSet, xAttribute, yAttribute/*, controllerMethods*/);
        }, [dataSetSlice, dispatch]);// if dependencies, useEffect is called after each data update, in our case only matrixData changes.
      

    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col2">
            {/* Add a log to check if the div is rendered */}
            {console.log('Rendering divContainerRef')}
        </div>
    )
}

export default ScatterplotContainer;