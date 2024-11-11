import * as d3 from 'd3'
import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    matSvg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;

    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderMatrix()
        this.matSvg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","matSvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        ;

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // build xAxisG
        this.matSvg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.matSvg.append("g")
            .attr("class","yAxisG")
        ;

        // Add a brush for selection
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush end", this.brushHandler);

        // Append brush to SVG
        this.matSvg.append("g")
            .attr("class", "brush")
            .call(this.brush);
    }

    brushHandler = (event) => {
        const selection = event.selection;
        if (selection === null) {
            this.matSvg.selectAll(".dotG").classed("selected", false); // Reset selection if brush is cleared
            this.changeBorderAndOpacity(this.matSvg.selectAll(".dotG")); // Update appearance
            return;
        }
    
        const [[x0, y0], [x1, y1]] = selection;
        console.log("Brush bounds:", { x0, y0, x1, y1 }); // Log exact brush bounds
    
        // Update class for circles within the selection box
        this.matSvg.selectAll(".dotG")
            .classed("selected", d => {
                const x = this.xScale(d[this.xAttribute]);
                const y = this.yScale(d[this.yAttribute]);
                return x0 <= x && x <= x1 && y0 <= y && y <= y1;
            });
    
        this.changeBorderAndOpacity(this.matSvg.selectAll(".dotG")); // Update appearance
    }
    
    changeBorderAndOpacity(selection){

        console.log("Applying border and opacity changes to selection:", selection);
        
        selection.each(function(d) {
            //console.log("Dot data:", d, "Selected:", d3.select(this).classed("selected"));
        });
        
        selection.style("opacity", (item)=>{
            return item.selected?1:this.defaultOpacity;
        })
        ;

        selection.select(".dotCircle")
            .attr("stroke-width",(item)=>{
                return item.selected?2:0;
            })
        ;
    }

    updateDots(selection,xAttribute,yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                const xPos = this.xScale(item[xAttribute]);
                const yPos = this.yScale(item[yAttribute]);
                return "translate("+xPos+","+yPos+")";
            })
        this.changeBorderAndOpacity(selection)
    }

    highlightSelectedItems(selectedItems){
        // this.changeBorderAndOpacity(updateSelection);
        this.matSvg.selectAll(".dotG")
            // all elements with the class .cellG (empty the first time)
            .data(selectedItems,(itemData)=>itemData.index)
            .join(
                enter=>enter,
                update=>{
                    this.changeBorderAndOpacity(update);
                },
                exit => exit
            )
        ;
    }

    updateAxis = function(visData, xAttribute, yAttribute) {
        let minX, maxX;
    
        if (xAttribute === "Date") {
            // Use scaleTime for dates and format as "dd/mm/yyyy"
            this.xScale = d3.scaleTime().range([0, this.width]);
            minX = d3.min(visData, item => item[xAttribute]);
            maxX = d3.max(visData, item => item[xAttribute]);
            this.xScale.domain([minX, maxX]);
    
            this.matSvg.select(".xAxisG")
                .transition().duration(this.transitionDuration)
                .call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat("%d/%m/%Y")));
        } else {
            this.xScale = d3.scaleLinear().range([0, this.width]);
            minX = d3.min(visData, item => item[xAttribute]);
            maxX = d3.max(visData, item => item[xAttribute]);
            this.xScale.domain([minX, maxX]);
    
            this.matSvg.select(".xAxisG")
                .transition().duration(this.transitionDuration)
                .call(d3.axisBottom(this.xScale));
        }
    
        const minY = d3.min(visData, item => item[yAttribute]);
        const maxY = d3.max(visData, item => item[yAttribute]);
        this.yScale.domain([minY, maxY]);
    
        this.matSvg.select(".yAxisG")
            .transition().duration(this.transitionDuration)
            .call(d3.axisLeft(this.yScale));
    }
    
    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        // build the size scales and x,y axis
        this.updateAxis(visData,xAttribute,yAttribute);

        this.matSvg.selectAll(".dotG")
            // all elements with the class .cellG (empty the first time)
            .data(visData,(itemData)=>itemData.index)
            .join(
                enter=>{
                    console.log("Creating new dots for data:", enter.data()); // Log entering data
                
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","dotG")
                        .style("opacity",this.defaultOpacity)
                        .on("click", (event,itemData)=>{
                            controllerMethods.handleOnClick(itemData);
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","dotCircle")
                        .attr("r",this.circleRadius)
                        .attr("stroke","red")
                    ;
                    this.updateDots(itemG,xAttribute,yAttribute);
                },
                update=>{
                    console.log("Updating dots with data:", update.data()); // Log updating data
                
                    this.updateDots(update,xAttribute,yAttribute)
                },
                exit =>{
                    console.log("Removing dots for data:", exit.data()); // Log exiting data
                
                    exit.remove()
                    ;
                }

            )
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;