import './App.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSeoulBikeData } from './redux/DataSetSlice';
import ScatterplotComponent from './components/scatterplot/ScatterplotComponent';
import HeatmapComponent from './components/heatmap/HeatmapComponent';

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    console.log("App useEffect");
  });

  useEffect(() => {
    // Initialize the data from file
    dispatch(getSeoulBikeData());
  }, [dispatch]);

  return (
    <div className="App">
      <h1>Seoul Bike Sharing Data Visualization</h1>
      <div className="visualization-container">
        <ScatterplotComponent />
        <HeatmapComponent />
      </div>
    </div>
  );
}

export default App;
