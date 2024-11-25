import * as d3 from 'd3';

class ScatterplotD3 {
    constructor(svgElement, onBrush) {
        this.svgElement = svgElement;
        this.onBrush = onBrush;
        this.margin = { top: 50, right: 50, bottom: 50, left: 50 };
        this.width = svgElement.clientWidth - this.margin.left - this.margin.right;
        this.height = svgElement.clientHeight - this.margin.top - this.margin.bottom;
        this.svg = d3.select(svgElement)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.xAxisGroup = this.svg.append("g")
            .attr("class", "xAxisG")
            .attr("transform", "translate(0," + this.height + ")");
        
        this.xAxisGroup.append("text")
            .attr("class", "xAxisLabel")
            .attr("x", this.width / 2)
            .attr("y", this.margin.bottom - 10)
            .attr("fill", "black")
            .style("text-anchor", "middle");

        this.yAxisGroup = this.svg.append("g")
            .attr("class", "yAxisG");

        this.yAxisGroup.append("text")
            .attr("class", "yAxisLabel")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -this.margin.left + 10)
            .attr("fill", "black")
            .style("text-anchor", "middle");

        this.highlightedItems = new Set();
        this.circles = null;  
    }

    render(data, xAttribute, yAttribute) {
        this.data = data; 
        this.updateAxis(data, xAttribute, yAttribute);
    
        const isXDate = xAttribute === "Date";
        const isYDate = yAttribute === "Date";
    
        const xScale = isXDate
            ? d3.scaleTime()
            : d3.scaleLinear();

        xScale
            .domain(d3.extent(data, d => isXDate ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]))
            .range([0, this.width]);
    
        const yScale = isYDate
            ? d3.scaleTime()
            : d3.scaleLinear();
        yScale
            .domain(d3.extent(data, d => isYDate ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]))
            .range([this.height, 0]);
    
        // Update circles with smooth transition
        this.circles = this.svg.selectAll("circle")
            .data(data, d => d.index)
            .join(
                enter => enter.append("circle")
                    .attr("cx", d => xScale(isXDate ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]))
                    .attr("cy", d => yScale(isYDate ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]))
                    .attr("r", 3)
                    .attr("fill", d => this.highlightedItems.has(d) ? "red" : "black")
                    .attr("opacity", 0.3),
                update => update
                    .transition()  
                    .duration(1000)  
                    .attr("cx", d => xScale(isXDate ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]))
                    .attr("cy", d => yScale(isYDate ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]))
            );
    
        this.svg.selectAll(".brush").remove();
    
        const brushGroup = this.svg.append("g")
            .attr("class", "brush")
            .style("visibility", "hidden"); 
    
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start", (event) => {
                brushGroup.style("visibility", "visible"); 
                // Reset heatmap selection
                d3.selectAll(".cell") 
                .attr("stroke", "#ccc")     
                .attr("stroke-width", 0.5);
                        
            })
            .on("brush", (event) => {
                if (event.selection) {
                    const [[x0, y0], [x1, y1]] = event.selection;
                    const selectedData = data.filter(d =>
                        x0 <= xScale(isXDate ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]) &&
                        xScale(isXDate ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]) <= x1 &&
                        y0 <= yScale(isYDate ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]) &&
                        yScale(isYDate ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]) <= y1
                    );
                    this.highlightedItems = new Set(selectedData);
                    this.circles
                        .attr("fill", d => this.highlightedItems.has(d) ? "red" : "black");
                    this.onBrush(selectedData);
                }
            });
    
        brushGroup.call(brush);
    }
    
    
    highLightElements(selectedItems) {
        //console.log("Selected items:", selectedItems);
        if (!selectedItems || selectedItems.size === 0) {
            // Clear highlights if no items are selected
            this.highlightedItems.clear();
            this.circles
                .transition()  
                .duration(1000)  
                .attr("fill", "black");
            return;
        }
    
        this.highlightedItems = new Set(selectedItems);
    
        // Update the circles to reflect the highlighted points with transition
        this.circles
        .transition()  
        .duration(1000)  
        .attr("fill", d => {
            if (!d.Date || typeof d.Date !== 'string' || d.Date.trim() === '') {
                return "black"; // Return black if the Date is invalid
            }

            // Extract the day from the Date field (in format "DD/MM/YYYY")
            const dateParts = d.Date.split("/");
            const dateObj = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`);
            const dayFromData = dateObj.getDay(); // Get the day of the week (0-6)
            const monthFromData = dateObj.getMonth() + 1; // Get the month (1-12)

            // Check if the item in data matches the selected filters
            const isHighlighted = Array.from(this.highlightedItems).some(item => {
            const isDayMatch = item.Days === dayFromData;
            const isMonthMatch = item.Months === monthFromData;
            const isSeasonMatch = item.Seasons === d.Seasons;
            const isHolidayMatch = item.Holiday === d.Holiday;
            const isHourMatch = item.Hours === d.Hour;

            const match = [isDayMatch, isMonthMatch, isHolidayMatch, isSeasonMatch, isHourMatch].filter(Boolean).length;
            
            // Return true if the item matches the 2 filters (the x and y attributes of the heatmap)
            return match === 2;
        });

        return isHighlighted ? "red" : "black";
        });

    }
    
    
    updateAxis(visData, xAttribute, yAttribute) {
        const minX = d3.min(visData, d => xAttribute === "Date" ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]);
        const maxX = d3.max(visData, d => xAttribute === "Date" ? d3.timeParse("%d/%m/%Y")(d[xAttribute]) : d[xAttribute]);
        const minY = d3.min(visData, d => yAttribute === "Date" ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]);
        const maxY = d3.max(visData, d => yAttribute === "Date" ? d3.timeParse("%d/%m/%Y")(d[yAttribute]) : d[yAttribute]);
    
        if (xAttribute === "Date") {
            this.xScale = d3.scaleTime().range([0, this.width]);
            this.xScale.domain([minX, maxX]);
        } else {
            this.xScale = d3.scaleLinear().range([0, this.width]);
            this.xScale.domain([minX, maxX]);
        }
        if (yAttribute === "Date") {
            this.yScale = d3.scaleTime().range([this.height, 0]);
            this.yScale.domain([minY, maxY]);
        } else {
            this.yScale = d3.scaleLinear().range([this.height, 0]);
            this.yScale.domain([minY, maxY]);
        }
    
        if (xAttribute === "Date") {
            this.xAxisGroup
                .transition()
                .duration(500)
                .call(d3.axisBottom(this.xScale).tickFormat(d => {
                    // Format the date to display MM/YYYY with the first 3 letters of the month
                    const formattedDate = d3.timeFormat("%B %Y")(d); // Full month name (e.g., "January 2018")
                    const month = formattedDate.split(" ")[0]; // Get the month part (e.g., "January")
                    const truncatedMonth = month.substring(0, 3); // Truncate to the first 3 letters (e.g., "Jan")
                    const year = formattedDate.split(" ")[1]; // Get the year part (e.g., "2018")
                    return `${truncatedMonth} ${year}`; // Return "Jan 2018"
                }));
        } else {
            this.xAxisGroup
                .transition()
                .duration(500)
                .call(d3.axisBottom(this.xScale));
        }
        
        if (yAttribute === "Date") {
            this.yAxisGroup
                .transition()
                .duration(500)
                .call(d3.axisLeft(this.yScale).tickFormat(d => {
                    // Format the date to display MM/YYYY with the first 3 letters of the month
                    const formattedDate = d3.timeFormat("%B %Y")(d); 
                    const month = formattedDate.split(" ")[0]; 
                    const truncatedMonth = month.substring(0, 3); 
                    const year = formattedDate.split(" ")[1]; 
                    return `${truncatedMonth} ${year}`; 
                }));
        } else {
            this.yAxisGroup
                .transition()
                .duration(500)
                .call(d3.axisLeft(this.yScale));
        }
        
        // Update x-axis label
        this.xAxisGroup.select(".xAxisLabel").text(xAttribute);
        // Update y-axis label
        this.yAxisGroup.select(".yAxisLabel").text(yAttribute);
    }
}

export default ScatterplotD3;
