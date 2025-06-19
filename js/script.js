//Side bar page navigation
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show the selected section
    document.getElementById(sectionId).classList.add('active');
}

async function fetchData(callback) {
    const response = await fetch('data/results-person1.csv');
    const data = await response.text();

    Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const rows = results.data;

            // Function to convert and round values
            const convertAndRound = (value) => Math.ceil(parseFloat(value.replace(',', '.')) * 10) / 10;

            // Convert and round values for all rows
            const allData = rows.map(row => ({
                t: row.t,
                HR: convertAndRound(row.HR),
                Power: convertAndRound(row.Power),
                VO2: convertAndRound(row.VO2),
                VCO2: convertAndRound(row.VCO2),
                Rf: convertAndRound(row.Rf),
                VT: convertAndRound(row.VT)
            })).filter(row => 
              !isNaN(row.HR) && 
              !isNaN(row.Power) && 
              !isNaN(row.VO2) && 
              !isNaN(row.VCO2)&&
              !isNaN(row.Rf) &&
              !isNaN(row.VT)) ;

            // Call the callback function with the data
            callback(allData);
        }
    });
}

// function calculatePrestatiezones(data) {
//     const prestatiezones = {
//         "ERG LICHT": { start: null, end: null },
//         "LICHT": { start: null, end: null },
//         "MATIG": { start: null, end: null },
//         "ZWAAR": { start: null, end: null },
//         "MAX": { start: null, end: null }
//     };

//     data.forEach((d, i) => {
//         const lactate = d.Lactate;
//         const time = d.t;

//         if (lactate < 1.5) {
//             if (!prestatiezones["ERG LICHT"].start) prestatiezones["ERG LICHT"].start = time;
//             prestatiezones["ERG LICHT"].end = time;
//         } else if (lactate >= 1.5 && lactate < 2) {
//             if (!prestatiezones["LICHT"].start) prestatiezones["LICHT"].start = time;
//             prestatiezones["LICHT"].end = time;
//         } else if (lactate >= 2 && lactate < 3) {
//             if (!prestatiezones["MATIG"].start) prestatiezones["MATIG"].start = time;
//             prestatiezones["MATIG"].end = time;
//         } else if (lactate >= 3 && lactate < 6) {
//             if (!prestatiezones["ZWAAR"].start) prestatiezones["ZWAAR"].start = time;
//             prestatiezones["ZWAAR"].end = time;
//         } else if (lactate >= 6) {
//             if (!prestatiezones["MAX"].start) prestatiezones["MAX"].start = time;
//             prestatiezones["MAX"].end = time;
//         }
//     });

//     console.log("Prestatiezones:", prestatiezones);
// }
// fetchData(calculatePrestatiezones);

function addPrestatiezones(svg, x, height) {
    // Define prestatiezones
    const prestatiezones = {
        "ERG LICHT": { start: 0, end: 235, color: "#60FD78", label: "ERG LICHT La <1.5" },
        "LICHT": { start: 235, end: 635, color: "#FCE65C", label: "LICHT La 1.5-2" },
        "MATIG": { start: 635, end: 815, color: "#FFA743", label: "MATIG La 2-3" },
        "ZWAAR": { start: 815, end: 1190, color: "#5978FF", label: "ZWAAR La 3-6" },
        "MAX": { start: 1190, end: 1505, color: "#F26DFF", label: "MAX La >6" }
    };

    // Add dotted lines and labels for prestatiezones
    Object.keys(prestatiezones).forEach(zone => {
        const { start, end, color, label } = prestatiezones[zone];

        // Add start line
        svg.append("line")
            .attr("x1", x(start))
            .attr("y1", 0)
            .attr("x2", x(start))
            .attr("y2", height)
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4");

        // Add end line
        svg.append("line")
            .attr("x1", x(end))
            .attr("y1", 0)
            .attr("x2", x(end))
            .attr("y2", height)
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4");

        // Add background rectangle for label
        svg.append("rect")
            .attr("x", (x(start) + x(end)) / 2 - 50) // Adjust width as needed
            .attr("y", -40) // Adjust height as needed
            .attr("width", 100) // Adjust width as needed
            .attr("height", 20) // Adjust height as needed
            .attr("fill", color)
            .attr("opacity", 0.7);

        // Add label
        svg.append("text")
            .attr("x", (x(start) + x(end)) / 2)
            .attr("y", -23)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", "black")
            .text(label);
    });
}

//---------every 1 minute---------------------
async function fetchDataEveryMinute(callback) {
  fetchData(function(allData) {
      // Convert time to minutes and extract HR, Power, VO2, and VCO2
      const formattedData = allData
          .filter(d => d.t) // Filter out rows where t is undefined
          .map(d => {
              const [hours, minutes] = d.t.split(":").map(Number);
              const timeInMinutes = hours * 60 + minutes;
              return { time: timeInMinutes, 
                        HR: d.HR, 
                        Power: d.Power, 
                        VO2: d.VO2, 
                        VCO2: d.VCO2,
                        Rf: d.Rf,
                        VT: d.VT};
          });

      // Extract first and last data points by time
      const firstDataPoint = formattedData[0]; // First row 
      const lastDataPoint = formattedData[formattedData.length - 1]; // Last row

      // Filter data points for every whole minute
      let filteredData = formattedData.filter(d => d.time % 60 === 0);

      // Add the first and last data points to the filtered data
      filteredData = [firstDataPoint, ...filteredData, lastDataPoint];

      console.log('Filtered Data Every 1min:', filteredData); // Debugging line

      // Call the callback function with the filtered data and all data
      callback(filteredData, allData);
  });
}

//---------every 5 minutes---------------------
async function fetchDataEveryFiveMinutes(callback) {
    fetchData(function(allData) {
        // Convert time to minutes and extract HR, Power, VO2, and VCO2
        const formattedData = allData
            .filter(d => d.t) // Filter out rows where t is undefined
            .map(d => {
                const [hours, minutes] = d.t.split(":").map(Number);
                const timeInMinutes = hours * 60 + minutes;
                return { time: timeInMinutes, 
                          HR: d.HR, 
                          Power: d.Power, 
                          VO2: d.VO2, 
                          VCO2: d.VCO2,
                          Rf: d.Rf,
                          VT: d.VT};
            });
  
        // Extract first and last data points by time
        const firstDataPoint = formattedData[0]; // First row 
        const lastDataPoint = formattedData[formattedData.length - 1]; // Last row
  
        // Filter data points for every whole minute
        let filteredData = formattedData.filter(d => d.time % 300 === 0);
  
        // Add the first and last data points to the filtered data
        filteredData = [firstDataPoint, ...filteredData, lastDataPoint];
  
        console.log('Filtered Data 5min:', filteredData); // Debugging line
  
        // Call the callback function with the filtered data and all data
        callback(filteredData, allData);
    });
  }

//---------every 10 minutes---------------------
async function fetchDataEveryTenMinutes(callback) {
    fetchData(function(allData) {
        // Convert time to minutes and extract HR, Power, VO2, and VCO2
        const formattedData = allData
            .filter(d => d.t) // Filter out rows where t is undefined
            .map(d => {
                const [hours, minutes] = d.t.split(":").map(Number);
                const timeInMinutes = hours * 60 + minutes;
                return { time: timeInMinutes, 
                          HR: d.HR, 
                          Power: d.Power, 
                          VO2: d.VO2, 
                          VCO2: d.VCO2,
                          Rf: d.Rf,
                          VT: d.VT};
            });
  
        // Extract first and last data points by time
        const firstDataPoint = formattedData[0]; // First row 
        const lastDataPoint = formattedData[formattedData.length - 1]; // Last row
  
        // Filter data points for every whole minute
        let filteredData = formattedData.filter(d => d.time % 600 === 0);
  
        // Add the first and last data points to the filtered data
        filteredData = [firstDataPoint, ...filteredData, lastDataPoint];
  
        console.log('Filtered Data 10min:', filteredData); // Debugging line
  
        // Call the callback function with the filtered data and all data
        callback(filteredData, allData);
    });
}

//---------every data point => every 5 second---------------------
async function fetchDataEveryFiveSecond(callback) {
    fetchData(function(allData) {
        // Convert time to minutes and extract HR, Power, VO2, and VCO2
        const formattedData = allData
            .filter(d => d.t) // Filter out rows where t is undefined
            .map(d => {
                const [hours, minutes] = d.t.split(":").map(Number);
                const timeInMinutes = hours * 60 + minutes;
                return { time: timeInMinutes, 
                          HR: d.HR, 
                          Power: d.Power, 
                          VO2: d.VO2, 
                          VCO2: d.VCO2,
                          Rf: d.Rf,
                          VT: d.VT};
            });
  
        // Extract first and last data points by time
        const firstDataPoint = formattedData[0]; // First row 
        const lastDataPoint = formattedData[formattedData.length - 1]; // Last row
  
        // Filter data points for every whole minute
        let filteredData = formattedData.filter(d => d.time % 5 === 0);
  
        // Add the first and last data points to the filtered data
        filteredData = [firstDataPoint, ...filteredData, lastDataPoint];
  
        console.log('Filtered Data 5sec:', filteredData); // Debugging line
  
        // Call the callback function with the filtered data and all data
        callback(filteredData, allData);
    });
}

function lineGraphPowerHR(data) {
    // Check if data is undefined
    if (!data) {
        console.error('Data is undefined:', data);
        return;
    }

    // Set the dimensions and margins of the graph
    var margin = {top: 35, right: 60, bottom: 30, left: 60},
        width = 635 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    var svg = d3.select("#linegraph-HR-Power")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Calculate the maximum values for HR, Power, and time
    var maxHR = d3.max(data, function(d) { return d.HR; });
    var maxPower = d3.max(data, function(d) { return d.Power; });
    var maxTime = d3.max(data, function(d) { return d.time; });

    // Add X axis for time values
    var x = d3.scaleLinear()
        .domain([0, maxTime])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickValues(d3.range(0, maxTime + 1, 120)) // Set tick values every 2 minutes
            .tickFormat(function(d) {
                var hours = Math.floor(d / 60);
                var minutes = d % 60;
                return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
            })
        );

    // Add Y axis for HR on the left with a range from 0 to maxHR
    var yLeft = d3.scaleLinear()
        .domain([0, maxHR])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yLeft));

    // Add Y axis for Power on the right with a range from 0 to maxPower
    var yRight = d3.scaleLinear()
        .domain([0, maxPower])
        .range([height, 0]);
    svg.append("g")
        .attr("transform", "translate(" + width + " ,0)")   
        .call(d3.axisRight(yRight));

    // Draw the smooth line for HR
    var hrLine = svg.append("path")
        .datum(data)
        .attr("class", "hr-line")
        .attr("fill", "none")
        .attr("stroke", "#fb2618")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return x(d.time); })
            .y(function(d) { return yLeft(d.HR); })
            .curve(d3.curveMonotoneX) // Apply smoothing
    );

    // Draw the smooth line for Power
    var powerLine = svg.append("path")
        .datum(data)
        .attr("class", "power-line")
        .attr("fill", "none")
        .attr("stroke", "#b8b800")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return x(d.time); })
            .y(function(d) { return yRight(d.Power); })
            .curve(d3.curveMonotoneX) // Apply smoothing
        );

    // Create a tooltip
    var Tooltip = d3.select("#linegraph-HR-Power")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("z-index", "10");

    // Three functions that change the tooltip when user hover / move / leave a cell
    var mouseover = function(event, d) {
        Tooltip.style("opacity", 1);
    };
    var mousemove = function(event, d) {
        // Convert time (minutes) to HH:mm format
        var hours = Math.floor(d.time / 60);
        var minutes = d.time % 60;
        var formattedTime = hours + ":" + (minutes < 10 ? "0" : "") + minutes;

        Tooltip
            .html("Tijd: " + formattedTime + "<br>HR: " + d.HR + "<br>Power: " + d.Power)
            .style("left", `${event.layerX + 10}px`)
            .style("top", `${event.layerY}px`);
    };
    var mouseleave = function(event, d) {
        Tooltip.style("opacity", 0);
    };

    // Add the points for HR
    svg.selectAll(".dotHR")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dotHR")
        .attr("cx", function(d) { return x(d.time); })
        .attr("cy", function(d) { return yLeft(d.HR); })
        .attr("r", 3)
        .attr("fill", "#fb2618")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add the points for Power
    svg.selectAll(".dotPower")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dotPower")
        .attr("cx", function(d) { return x(d.time); })
        .attr("cy", function(d) { return yRight(d.Power); })
        .attr("r", 3)
        .attr("fill", "#b8b800")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    
    // Add an icon to the div on the border
    d3.select("#linegraph-HR-Power")
        .append("div")
        .attr("class", "icon")
        .style("position", "absolute")
        .style("top", "-32px") 
        .style("left", "0px") 
        .html('<i class="bi bi-heart-pulse-fill icon-heart"></i>');

    // Add an icon to the div on the border
    d3.select("#linegraph-HR-Power")
        .append("div")
        .attr("class", "icon")
        .style("position", "absolute")
        .style("top", "-32px") 
        .style("right", "0px") 
        .html('<i class="bi bi-lightning-charge-fill icon-power"></i>');
        
    //--------------------------------------- 
    // Call the addPrestatiezones function
    addPrestatiezones(svg, x, height); 
        
    //---------------------------------------
    // Add legend
    svg.append("circle").attr("cx", width - 500).attr("cy", 10).attr("r", 6).style("fill", "#fb2618").attr("class", "hr-legend");
    svg.append("circle").attr("cx", width - 500).attr("cy", 30).attr("r", 6).style("fill", "#b8b800").attr("class", "power-legend");
    svg.append("text").attr("x", width - 490).attr("y", 12).text("HR").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "hr-legend");
    svg.append("text").attr("x", width - 490).attr("y", 32).text("Power").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "power-legend");

    // Add Y axis label at the top left of the x-axis
    svg.append("text")
        .attr("x", -60)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("HR(bpm)");

    // Add Y axis label at the top right of the x-axis
    svg.append("text")
        .attr("x", width)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("Power(W)");

    // Add X axis label at the bottom right of the x-axis
    svg.append("text")
        .attr("x", width)
        .attr("y", height + margin.bottom - 1)
        .style("text-anchor", "end")
        .style("font-size", "12px")        
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("Tijd (min)");

    //TOGGLE BUTTONS
    // Add a rectangle button for HR control
    var hrButton = d3.select("#linegraph-HR-Power")
        .append("svg")
        .attr("width", 60)
        .attr("height", 22)
        .style("position", "absolute")
        .style("bottom", "-23px") 
        .style("left", "45px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "red");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.dotHR').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.hr-line').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.hr-legend').style('display', isActive ? 'none' : 'block');
        });

    hrButton.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "red")
        .classed("active", true);

    hrButton.append("text")
        .attr("x", 30)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");

    // Add a rectangle button for Power control
    var powerButton = d3.select("#linegraph-HR-Power")
        .append("svg")
        .attr("width", 60)
        .attr("height", 22)
        .style("position", "absolute")
        .style("bottom", "-23px")
        .style("left", "120px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "#b8b800");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.dotPower').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.power-line').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.power-legend').style('display', isActive ? 'none' : 'block');
        });

    powerButton.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "#b8b800")
        .classed("active", true);

    powerButton.append("text")
        .attr("x", 30)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");
}
// fetchDataEveryMinute(lineGraphPowerHR);

function lineGraphRfVT(data) {
    // Set the dimensions and margins of the graph
    const margin = { top: 19, right: 62, bottom: 30, left: 60 },
          width = 635 - margin.left - margin.right,
          height = 250 - margin.top - margin.bottom;
  
    // Append the svg object to the body of the page
    const svg = d3.select("#linegraph-Rf-VT")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Calculate the maximum values for VT, Rf, and time
    const maxVT = d3.max(data, d => d.VT);
    const maxRf = d3.max(data, d => d.Rf);
    const maxTime = d3.max(data, d => d.time);
  
    // Add X axis for time values
    var x = d3.scaleLinear()
    .domain([0, maxTime])
    .range([0, width]);
  
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
        .tickValues(d3.range(0, maxTime + 1, 120)) // Set tick values every 2 minutes
        .tickFormat(function(d) {
          var hours = Math.floor(d / 60);
          var minutes = d % 60;
          return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
        })
      );
  
    // Add Y axis for VT on the left with a range from 0 to maxVT
    const yLeft = d3.scaleLinear()
        .domain([0, maxVT])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yLeft));
  
    // Add Y axis for Rf on the right with a range from 0 to maxRf
    const yRight = d3.scaleLinear()
        .domain([0, maxRf])
        .range([height, 0]);
    svg.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(yRight));
  
    // Draw the smooth line for VT
    svg.append("path")
        .datum(data)
        .attr("class", "vt-line")
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.time))
            .y(d => yLeft(d.VT))
            .curve(d3.curveMonotoneX) // Apply smoothing
        );
        
    // Define the area for VT
    const areaVT = d3.area()
    .x(d => x(d.time))
    .y0(height)
    .y1(d => yLeft(d.VT))
    .curve(d3.curveMonotoneX); // Apply smoothing

    // Draw the area for VT
    svg.append("path")
    .datum(data)
    .attr("class", "vt-area")
    .attr("fill", "lightgreen")
    .attr("opacity", 0.5)
    .attr("d", areaVT);
    
    //-------------Rf--------------
    // Draw the smooth line for Rf
    svg.append("path")
        .datum(data)
        .attr("class", "rf-line")
        .attr("fill", "none")
        .attr("stroke", "purple")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.time))
            .y(d => yRight(d.Rf))
            .curve(d3.curveMonotoneX) // Apply smoothing
        );
  
    // Define the area for Rf
    const areaRf = d3.area()
        .x(d => x(d.time))
        .y0(height)
        .y1(d => yRight(d.Rf))
        .curve(d3.curveMonotoneX); // Apply smoothing
    // Draw the area for Rf
    svg.append("path")
        .datum(data)
        .attr("class", "rf-area")
        .attr("fill", "#F26DFF")
        .attr("opacity", 0.5)
        .attr("d", areaRf);

    //------------------------------------------------------------------------------
     // Create a tooltip
     var Tooltip = d3.select("#linegraph-Rf-VT")
     .append("div")
     .style("opacity", 0)
     .attr("class", "tooltip")
     .style("background-color", "white")
     .style("border", "solid")
     .style("border-width", "2px")
     .style("border-radius", "5px")
     .style("padding", "5px")
     .style("width", "auto")    
     .style("height", "auto")
     .style("position", "absolute")
     .style("z-index", "10");

    
    // Three functions that change the tooltip when user hover / move / leave a cell
    var mouseover = function(event, d) {
        Tooltip.style("opacity", 1);
    };
    var mousemove = function(event, d) {
        // Convert time (minutes) to HH:mm format
        var hours = Math.floor(d.time / 60);
        var minutes = d.time % 60;
        var formattedTime = hours + ":" + (minutes < 10 ? "0" : "") + minutes;

        Tooltip
            .html("Tijd: " + formattedTime + 
                  "<br>VT: " + d.VT.toFixed(2) + " L(btps)" +  // Format to 2 decimal places
                  "<br>Rf: " + d.Rf.toFixed(1) + " 1/min")     // Format to 1 decimal place
            .style("left", `${event.layerX + 10}px`)
            .style("top", `${event.layerY}px`);
    };
    var mouseleave = function(event, d) {
        Tooltip.style("opacity", 0);
    };

    // Add the points for VT
    svg.selectAll(".dotVT")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dotVT")
        .attr("cx", function(d) { return x(d.time); })
        .attr("cy", function(d) { return yLeft(d.VT); })
        .attr("r", 3)
        .attr("fill", "green")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add the points for Rf
    svg.selectAll(".dotRf")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dotRf")
        .attr("cx", function(d) { return x(d.time); })
        .attr("cy", function(d) { return yRight(d.Rf); })
        .attr("r", 3)
        .attr("fill", "purple")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    //----------------------------------------------------
      // Call the addPrestatiezones function
    addPrestatiezones(svg, x, height);
    //----------------------------------------------------
      // Add legend
    svg.append("circle").attr("cx", width - 500).attr("cy", 10).attr("r", 6).style("fill", "#0c9e0c").attr("class", "vt-legend");
    svg.append("circle").attr("cx", width - 500).attr("cy", 30).attr("r", 6).style("fill", "#a814a8").attr("class", "rf-legend");
    svg.append("text").attr("x", width - 490).attr("y", 12).text("VT").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "vt-legend");
    svg.append("text").attr("x", width - 490).attr("y", 32).text("Rf").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "rf-legend");

    // Add Y axis label at the top left of the x-axis
    svg.append("text")
        .attr("x", -60)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("VT(L(btps))");

    // Add Y axis label at the top right of the x-axis
    svg.append("text")
        .attr("x", width)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("Rf(1/min)");

    // Add X axis label at the bottom right of the x-axis
    svg.append("text")
        .attr("x", width)
        .attr("y", height + margin.bottom - 1)
        .style("text-anchor", "end")
        .style("font-size", "12px")        
        .style("font-weight", "bold")
        .text("Tijd (min)");
    
    // Add an icon to the div on the border
    d3.select("#linegraph-Rf-VT")
        .append("div")
        .attr("class", "icon")
        .style("position", "absolute")
        .style("top", "-32px") 
        .style("left", "0px") 
        .html('<i class="bi bi-lungs-fill icon-lung-linechart"></i>');

    //TOGGLE BUTTONS
    // Add a rectangle button for VT control
    var vtButton = d3.select("#linegraph-Rf-VT")
        .append("svg")
        .attr("width", 60)
        .attr("height", 22)
        .style("position", "absolute")
        .style("bottom", "-23px") // Adjusted position
        .style("left", "45px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "#0c9e0c");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.dotVT').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.vt-line').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.vt-area').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.vt-legend').style('display', isActive ? 'none' : 'block');
        });

    vtButton.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "#0c9e0c")
        .classed("active", true);

    vtButton.append("text")
        .attr("x", 30)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");

    // Add a rectangle button for Rf control
    var rfButton = d3.select("#linegraph-Rf-VT")
        .append("svg")
        .attr("width", 60)
        .attr("height", 22)
        .style("position", "absolute")
        .style("bottom", "-23px") // Adjusted position
        .style("left", "120px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "#a814a8");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.dotRf').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.rf-line').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.rf-area').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.rf-legend').style('display', isActive ? 'none' : 'block');
        });

    rfButton.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "#a814a8")
        .classed("active", true);

    rfButton.append("text")
        .attr("x", 30)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");
        
}
// fetchDataEveryMinute(lineGraphRfVT);

function barchartVO2VCO2(data) {
    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 50, left: 100 },
            width = 650 - margin.left - margin.right,
            height = 190 - margin.top - margin.bottom;

    // Remove any existing SVG elements in the container
    d3.select("#barchart-VO2-VCO2").selectAll("*").remove();

    // Create a tooltip
    const Tooltip = d3.select("#barchart-VO2-VCO2")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("width", "auto")
        .style("height", "auto")
        .style("position", "absolute")
        .style("z-index", "10");

    // Append the svg object to the body of the page
    const svg = d3.select("#barchart-VO2-VCO2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Convert time to minutes and extract VO2 and VCO2
    const formattedData = data
        .filter(d => d.time !== undefined && d.VO2 !== undefined && d.VCO2 !== undefined)
        .map(d => ({
            time: d.time,
            VO2: d.VO2,
            VCO2: d.VCO2
        }));

    // Calculate the maximum value for VO2 and VCO2
    const maxYValue = d3.max(formattedData, d => Math.max(d.VO2, d.VCO2));
    const maxXValue = Math.max(1505, d3.max(formattedData, d => d.time)); // Consider both data and prestatiezone range

    // Add X axis
    const x = d3.scaleBand()
    .domain(formattedData.map(d => d.time))
    .range([0, width])
    .padding(0.1);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues(formattedData
                .map(d => d.time)
                .filter((d, i) => i % 2 === 0)) // Show every 2nd tick
            .tickFormat(d => {
                const hours = Math.floor(d / 60);
                const minutes = d % 60;
                return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
            }));

    // Add Y axis for VO2 and VCO2 on the left 
    const yLeft = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yLeft));

    // Add horizontal grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("stroke-dasharray", "4")
        .attr("stroke", "grey")
        .call(d3.axisLeft(yLeft)
            .tickSize(-width)
            .tickFormat("")
        );

    // Add performance zones
    const prestatiezones = {
        "ERG LICHT": { start: 0, end: 235, color: "#60FD78", label: "ERG LICHT La <1.5" },
        "LICHT": { start: 235, end: 635, color: "#FCE65C", label: "LICHT La 1.5-2" },
        "MATIG": { start: 635, end: 815, color: "#FFA743", label: "MATIG La 2-3" },
        "ZWAAR": { start: 815, end: 1190, color: "#5978FF", label: "ZWAAR La 3-6" },
        "MAX": { start: 1190, end: 1505, color: "#F26DFF", label: "MAX La >6" }
    };

    // Add zone lines and labels
    Object.values(prestatiezones).forEach(zone => {
        // Add vertical lines at zone boundaries
        svg.append("line")
            .attr("x1", x(zone.start))
            .attr("y1", 0)
            .attr("x2", x(zone.start))
            .attr("y2", height)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4");

        svg.append("line")
            .attr("x1", x(zone.end))
            .attr("y1", 0)
            .attr("x2", x(zone.end))
            .attr("y2", height)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4");
        });


    //  // Bar width calculation
    //  const barWidth = Math.min(20, width / formattedData.length / 2.5); // Adjust the divisor to change bar width

    // Tooltip event handlers
    const mouseover = function(event, d) {
        Tooltip.style("opacity", 1);
    };

    const mousemove = function(event, d) {
        // Convert time to HH:mm format
        const hours = Math.floor(d.time / 60);
        const minutes = d.time % 60;
        const formattedTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;

        Tooltip
            .html(
                "Tijd: " + formattedTime + "<br>" +
                "VO2: " + d.VO2.toFixed(2) + " mL/min<br>" +
                "VCO2: " + d.VCO2.toFixed(2) + " mL/min"
            )
            .style("left", `${event.layerX + 10}px`)
            .style("top", `${event.layerY}px`);
    };

    const mouseleave = function(event, d) {
        Tooltip.style("opacity", 0);
    };

    // Add bars for VO2 with tooltip
    svg.selectAll(".barVO2")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "barVO2")
        .attr("x", d => x(d.time))
        .attr("y", d => yLeft(d.VO2))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => height - yLeft(d.VO2))
        .attr("fill", "#408ce3")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add bars for VCO2 with tooltip
    svg.selectAll(".barVCO2")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "barVCO2")
        .attr("x", d => x(d.time) + x.bandwidth() / 2)
        .attr("y", d => yLeft(d.VCO2))
        .attr("width", x.bandwidth() / 2)
        .attr("height", d => height - yLeft(d.VCO2))
        .attr("fill", "#fe8d09")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

     // Add bars for the difference with tooltip
     svg.selectAll(".barDifference")
     .data(formattedData)
     .enter()
     .append("rect")
     .attr("class", "barDifference")
     .attr("x", d => x(d.time))
     .attr("y", d => yLeft(Math.max(0, d.difference)))
     .attr("width", x.bandwidth())
     .attr("height", d => Math.abs(yLeft(d.difference) - yLeft(0)))
     .attr("fill", d => d.difference > 0 ? "#408ce3" : "#fe8d09")
     

    // Add legend
    svg.append("circle").attr("cx", width - 613).attr("cy", 50).attr("r", 6).style("fill", "#408ce3").attr("class", "vo2-legend");
    svg.append("circle").attr("cx", width - 613).attr("cy", 80).attr("r", 6).style("fill", "#fe8d09").attr("class", "vco2-legend");
    svg.append("text").attr("x", width - 605).attr("y", 82).text("VCO2").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "vco2-legend");
    svg.append("text").attr("x", width - 605).attr("y", 52).text("VO2").style("font-size", "12px").attr("alignment-baseline", "middle").attr("class", "vo2-legend");

    // Add Y axis label
    svg.append("text")
        .attr("x", -100)
        .attr("y", 0)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("font-color", "grey")
        .text("VO2/VCO2");

    svg.append("text")
        .attr("x", -100)
        .attr("y", 17)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .text("(mL/min)");

    // Add X axis label
    svg.append("text")
        .attr("x", width)
        .attr("y", height + margin.bottom - 20)
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Tijd(min)");
    
    // Add an icon to the div on the border
    d3.select("#barchart-VO2-VCO2")
        .append("div")
        .attr("class", "icon")
        .style("position", "absolute")
        .style("top", "-32px") 
        .style("left", "0px") 
        .html('<i class="bi bi-lungs-fill icon-lung-barchart"></i>');
    
    /// Add a rectangle button for VO2 control
    var vo2Button = d3.select("#barchart-VO2-VCO2")
        .append("svg")
        .attr("width", 60)
        .attr("height", 20)
        .style("position", "absolute")
        .style("top", "-22px") // Adjusted position
        .style("right", "120px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "#408ce3");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.barVO2').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.vo2-legend').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.barDifference').filter(d => d.difference > 0).style('display', isActive ? 'none' : 'block');
        });

    vo2Button.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "#408ce3")
        .classed("active", true);

    vo2Button.append("text")
        .attr("x", 30)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");

    // Add a rectangle button for VCO2 control
    var vco2Button = d3.select("#barchart-VO2-VCO2")
        .append("svg")
        .attr("width", 60)
        .attr("height", 20)
        .style("position", "absolute")
        .style("top", "-22px") // Adjusted position
        .style("right", "45px")
        .style("border-radius", "10px")
        .style("cursor", "pointer")
        .on("click", function() {
            var isActive = d3.select(this).select("rect").classed("active");
            d3.select(this).select("rect")
                .classed("active", !isActive)
                .attr("fill", isActive ? "grey" : "#fe8d09");
            d3.select(this).select("text")
                .text(isActive ? "OFF" : "ON");
            d3.selectAll('.barVCO2').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.vco2-legend').style('display', isActive ? 'none' : 'block');
            d3.selectAll('.barDifference').filter(d => d.difference < 0).style('display', isActive ? 'none' : 'block');
        });

    vco2Button.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 60)
        .attr("height", 30)
        .attr("fill", "#fe8d09")
        .classed("active", true);

    vco2Button.append("text")
        .attr("x", 30)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("ON");
}
// fetchDataEveryMinute(barchartVO2VCO2);

//------------------------------------------------------------
// Function to create a bar chart for the difference between VO2 and VCO2
function createDifferenceBarChart(data) {
    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 40, left: 100 },
          width = 650 - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;

    // Remove any existing SVG elements in the container
    d3.select("#difference-barchart-VO2-VCO2").selectAll("*").remove();

    // Create a tooltip
    const Tooltip = d3.select("#difference-barchart-VO2-VCO2")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("width", "auto")
        .style("height", "auto")
        .style("position", "absolute")
        .style("z-index", "10");

    // Append the svg object to the body of the page
    const svg = d3.select("#difference-barchart-VO2-VCO2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Convert time to minutes and extract VO2 and VCO2
    const formattedData = data
        .filter(d => d.time !== undefined && d.VO2 !== undefined && d.VCO2 !== undefined)
        .map(d => {
            const difference = d.VO2 - d.VCO2;
            console.log(`Time: ${d.time}, Difference: ${difference}`);
            return {
                time: d.time,
                difference: difference
            };
        });

    // Calculate the maximum and minimum values for the difference
    const maxYValue = d3.max(formattedData, d => d.difference);
    const minYValue = d3.min(formattedData, d => d.difference);

    // Add X axis
    const x = d3.scaleBand()
        .domain(formattedData.map(d => d.time))
        .range([0, width])
        .padding(0.1);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues(formattedData
                .map(d => d.time)
                .filter((d, i) => i % 2 === 0)) // Show every 2nd tick
            .tickFormat(d => {
                const hours = Math.floor(d / 60);
                const minutes = d % 60;
                return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
            }));

    // Add Y axis for the difference
    const yLeft = d3.scaleLinear()
        .domain([minYValue, maxYValue])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(yLeft));

    // Add horizontal grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("stroke-dasharray", "4")
        .attr("stroke", "grey")
        .call(d3.axisLeft(yLeft)
            .tickSize(-width)
            .tickFormat("")
        );

    // Tooltip event handlers
    const mouseover = function(event, d) {
        Tooltip.style("opacity", 1);
    };

    const mousemove = function(event, d) {
        // Convert time to HH:mm format
        const hours = Math.floor(d.time / 60);
        const minutes = d.time % 60;
        const formattedTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;

        Tooltip
            .html(
                "Tijd: " + formattedTime + "<br>" +
                "Verchil: " + d.difference.toFixed(2) + " mL/min"
            )
            .style("left", `${event.layerX + 10}px`)
            .style("top", `${event.layerY}px`);
    };

    const mouseleave = function(event, d) {
        Tooltip.style("opacity", 0);
    };

    // Add bars for the difference with tooltip
    svg.selectAll(".barDifference")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "barDifference")
        .attr("x", d => x(d.time))
        .attr("y", d => yLeft(Math.max(0, d.difference)))
        .attr("width", x.bandwidth())
        .attr("height", d => Math.abs(yLeft(d.difference) - yLeft(0)))
        .attr("fill", d => d.difference > 0 ? "#408ce3" : "#fe8d09")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // // Add legend
    // svg.append("circle").attr("cx", width - 780).attr("cy", 20).attr("r", 6).style("fill", "green");
    // svg.append("circle").attr("cx", width - 780).attr("cy", 50).attr("r", 6).style("fill", "red");
    // svg.append("text").attr("x", width - 760).attr("y", 20).text("VO2 > VCO2").style("font-size", "15px").attr("alignment-baseline", "middle");
    // svg.append("text").attr("x", width - 760).attr("y", 50).text("VCO2 > VO2").style("font-size", "15px").attr("alignment-baseline", "middle");

    // Add Y axis label
    svg.append("text")
        .attr("x", -100)
        .attr("y", 0)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("font-color", "grey")
        .text("Verschil")


    svg.append("text")
        .attr("x", -100)
        .attr("y", 18)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("font-color", "grey")
        .text("VO2 - VCO2");

    svg.append("text")
        .attr("x", -100)
        .attr("y", 35)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .text("(mL/min)");

    
    // Add X axis label
    svg.append("text")
        .attr("x", width)
        .attr("y", height + margin.bottom - 1)
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Tijd(min)");
}

// fetchData(barchartVO2VCO2);
//fetch personal data------------------
// async function fetchPersonalData() {
//     const response = await fetch('data/personal-data-person1.csv');
//     const data = await response.text();

//     Papa.parse(data, {
//         header: true,
//         skipEmptyLines: true,
//         complete: function(results) {
//             const rows = results.data;

//             // Extract weight, height, and age from the specified rows and columns
//             const weight = rows[6][2]; // Row 7, Column 2 (index 6, 2)
//             const height = rows[5][2]; // Row 6, Column 2 (index 5, 2)
//             const age = rows[4][2]; // Row 5, Column 2 (index 4, 2)

//             // Update the HTML content
//             document.getElementById('weight-value').textContent = `${weight} kg`;
//             document.getElementById('height-value').textContent = `${height} cm`;
//             document.getElementById('age-value').textContent = `${age} `;
//         }
//     });
// }

// // Call the function to fetch and display the personal data
// fetchPersonalData();








//--------------------------------------------------------------------------------
//Max values prestatiecard
let maxValuesCase1 = {};
let maxValuesCase2 = {};

// Fetch maximum values from the specified CSV file
async function fetchMaxValues(filePath, caseNumber) {
    const response = await fetch(filePath);
    if (!response.ok) {
        console.error(`Failed to load resource: ${filePath} - ${response.statusText}`);
        return;
    }
    const data = await response.text();

    Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            const rows = results.data.slice(2); // Skip the first 2 lines (header and units)
    
            let maxLactaat = 0, maxVO2 = 0, maxVCO2 = 0, maxHR = 0, maxPower = 0, maxRf = 0, maxVT = 0;
    
            rows.forEach(row => {
                const lactaat = row[9] ? parseFloat(row[9].replace(',', '.')) : 0;
                const vo2 = row[4] ? parseFloat(row[4].replace(',', '.')) : 0;
                const vco2 = row[5] ? parseFloat(row[5].replace(',', '.')) : 0;
                const hr = row[7] ? parseFloat(row[7].replace(',', '.')) : 0;
                const power = row[8] ? parseFloat(row[8].replace(',', '.')) : 0;
                const rf = row[1] ? parseFloat(row[1].replace(',', '.')) : 0;
                const vt = row[2] ? parseFloat(row[2].replace(',', '.')) : 0;
    
                if (lactaat > maxLactaat) maxLactaat = lactaat;
                if (vo2 > maxVO2) maxVO2 = vo2;
                if (vco2 > maxVCO2) maxVCO2 = vco2;
                if (hr > maxHR) maxHR = hr;
                if (power > maxPower) maxPower = power;
                if (rf > maxRf) maxRf = rf;
                if (vt > maxVT) maxVT = vt;
            });
    
            const maxValues = { maxLactaat, maxVO2, maxVCO2, maxHR, maxPower, maxRf, maxVT };
            console.log(`Max Values for Case ${caseNumber}:`, maxValues); // Debugging line
    
            if (caseNumber === 1) {
        maxValuesCase1 = maxValues;
    } else if (caseNumber === 2) {
        maxValuesCase2 = maxValues;
    }
    
            // Round up to the nearest tenth
            const roundToTenth = (value) => Math.ceil(value * 10) / 10;
    
            document.getElementById('lactaat-value').textContent = `${roundToTenth(maxLactaat)} `;
            document.getElementById('vo2-value').textContent = `${roundToTenth(maxVO2)} `;
            document.getElementById('hr-value').textContent = `${roundToTenth(maxHR)} `;
            document.getElementById('power-value').textContent = `${roundToTenth(maxPower)} `;
    
            // Compare values and update icons
            if (caseNumber === 1) {
                compareMaxValues();
            }
        }
    });
}



// Compare the maximum values between the two cases and update the HTML
function compareMaxValues() {
    const compareAndUpdate = (value1, value2, elementId) => {
        const element = document.getElementById(elementId);
        if (value1 > value2) {
            element.innerHTML += ' <i class="bi bi-caret-up-fill" style="color: green;"></i>';
        } else if (value1 < value2) {
            element.innerHTML += ' <i class="bi bi-caret-down-fill" style="color: red;"></i>';
        }
    };

    compareAndUpdate(maxValuesCase1.maxLactaat, maxValuesCase2.maxLactaat, 'lactaat-value');
    compareAndUpdate(maxValuesCase1.maxVO2, maxValuesCase2.maxVO2, 'vo2-value');
    compareAndUpdate(maxValuesCase1.maxHR, maxValuesCase2.maxHR, 'hr-value');
    compareAndUpdate(maxValuesCase1.maxPower, maxValuesCase2.maxPower, 'power-value');
}


//------------------ZOOM LEVEL---------------------
function updateZoomLevel(zoomLevel) {
    // Clear existing SVG elements
    d3.select("#linegraph-HR-Power").selectAll("*").remove();
    d3.select("#linegraph-Rf-VT").selectAll("*").remove();
    d3.select("#barchart-VO2-VCO2").selectAll("*").remove();
    d3.select("#difference-barchart-VO2-VCO2").selectAll("*").remove();

    switch (zoomLevel) {
        case 1:
            fetchDataEveryMinute(lineGraphPowerHR);
            fetchDataEveryMinute(lineGraphRfVT);
            fetchDataEveryMinute(barchartVO2VCO2);
            fetchDataEveryMinute(createDifferenceBarChart);
            break;
        case 2:
            fetchDataEveryFiveMinutes(lineGraphPowerHR);
            fetchDataEveryFiveMinutes(lineGraphRfVT);
            fetchDataEveryFiveMinutes(barchartVO2VCO2);
            fetchDataEveryFiveMinutes(createDifferenceBarChart);
            break;
        case 3:
            fetchDataEveryTenMinutes(lineGraphPowerHR);
            fetchDataEveryTenMinutes(lineGraphRfVT);
            fetchDataEveryTenMinutes(barchartVO2VCO2);
            fetchDataEveryTenMinutes(createDifferenceBarChart);
            break;
        case 4:
            fetchDataEveryFiveSecond(lineGraphPowerHR);
            fetchDataEveryFiveSecond(lineGraphRfVT);
            fetchDataEveryFiveSecond(barchartVO2VCO2);
            fetchDataEveryFiveSecond(createDifferenceBarChart);
            break;
        default:
            console.error('Invalid zoom level:', zoomLevel);
    }
}

// Add event listeners to the zoom level selection elements
document.getElementById('zoomLevel1').addEventListener('click', () => updateZoomLevel(1));
document.getElementById('zoomLevel2').addEventListener('click', () => updateZoomLevel(2));
document.getElementById('zoomLevel3').addEventListener('click', () => updateZoomLevel(3));
document.getElementById('zoomLevel4').addEventListener('click', () => updateZoomLevel(4));

// // Initial call to set the default zoom level
updateZoomLevel(1);

document.addEventListener('DOMContentLoaded', function() {
    // Existing code for zoom level button
    const zoomLevelButton = document.getElementById('zoomLevelButton');
    const zoomLevels = document.querySelectorAll('.zoom-dropdown .zoom-dropdown-content a');

    zoomLevels.forEach(zoomLevel => {
        zoomLevel.addEventListener('click', function(event) {
            event.preventDefault();
            const selectedZoomLevel = event.target.textContent.trim();
            zoomLevelButton.innerHTML = `<i class="bi bi-stopwatch"></i> ${selectedZoomLevel} <i class="bi bi-plus-slash-minus plus-min-icon"></i>`;
            zoomLevelButton.style.backgroundColor = '#ffcfa0';
        });
    });

    // Add event listeners for the compare session dropdown
    const compareSessionButton = document.querySelector('.dropdown .dropbtn');
    const compareSessions = document.querySelectorAll('.dropdown .dropdown-content a');

    compareSessions.forEach(compareSession => {
        compareSession.addEventListener('click', function(event) {
            event.preventDefault();
            const selectedSession = event.target.textContent.trim();
            compareSessionButton.innerHTML = `${selectedSession} <span class="icon"><i class="bi bi-calendar2 calendar-icon"></i></span>`;
            compareSessionButton.style.backgroundColor = '#ffcfa0';
        });
    });
});


// Define the fetchMaxValuesBySession function
function fetchMaxValuesBySession(session) {
    let filePath;
    switch (session) {
        case 1:
            filePath = 'data/results-person1.csv';
            fetchMaxValues(filePath, 1);
            break;
        case 2:
            filePath = 'data/26-01-2024-old-results-person1-dummy-data.csv';
            fetchMaxValues(filePath, 2);
            break;
        default:
            console.error('Invalid session:', session);
            return;
    }
}

// Add event listeners for the session options
document.getElementById('session31Mei24').addEventListener('click', () => {
    fetchMaxValuesBySession(1);
});

document.getElementById('session28Jan24').addEventListener('click', () => {
    fetchMaxValuesBySession(2);
});

// Initial call to fetch the latest data and set the default zoom level
fetchMaxValuesBySession(1);

//--------------------------------------------------------------------------------
async function fetchAthleteData() {
    try {
        const response = await fetch('data/personal-data-person1.csv');
        const csvData = await response.text();

        Papa.parse(csvData, {
            header: false,
            skipEmptyLines: true,
            complete: function(results) {
                const rows = results.data;

                // Extract the required fields
                const leeftijd = rows[4][1]; // Row 5, Column 2 (index 4, 1)
                const lengte = rows[5][1]; // Row 6, Column 2 (index 5, 1)
                const gewicht = rows[6][1]; // Row 7, Column 2 (index 6, 1)
                const bmi = rows[10][5]; // Row 8, Column 2 (index 11, 6)
                const testtijd = rows[1][3]; // Row 2, Column 4 (index 1, 3)
                const testduur = rows[9][3]; // Row 10, Column 4 (index 9, 2)
                const ergometer = rows[13][3]; // Row 14, Column 4 (index 13, 3)

                // Display the extracted data
                console.log(`Leeftijd: ${leeftijd}`);
                console.log(`Lengte: ${lengte}`);
                console.log(`Gewicht: ${gewicht}`);
                console.log(`BMI: ${bmi}`);
                console.log('---');
                console.log(`Testduur: ${testduur}`);
                console.log(`Testtijd: ${testtijd}`);
                console.log(`Ergometer: ${ergometer}`);

                // Set the text content of existing elements with specific IDs
                document.getElementById('leeftijd-value').textContent = `Leeftijd: ${leeftijd}`;
                document.getElementById('lengte-value').textContent = `Lengte: ${lengte} cm`;
                document.getElementById('gewicht-value').textContent = `Gewicht: ${gewicht} kg`;
                document.getElementById('testduur-value').textContent = `Testduur: ${testduur}`;
                document.getElementById('testtijd-value').textContent = `Testtijd: ${testtijd}`;
                document.getElementById('ergometer-value').textContent = `Ergometer: ${ergometer}`;
        
            }
        });
    } catch (error) {
        console.error('Error fetching or parsing CSV data:', error);
    }
}
fetchAthleteData();


//--------------------------------------------------------------------------------
// async function readOldResultsAndPlot() {
//     const filePath = 'data/26-01-2024-old-results-person1-dummy-data.csv';
//     const response = await fetch(filePath);
//     const data = await response.text();

//     Papa.parse(data, {
//         header: true,
//         skipEmptyLines: true,
//         delimiter: ";",
//         complete: function(results) {
//             const rows = results.data;

//             // Improved conversion function with better error handling
//             const convertAndRound = (value) => {
//                 if (!value || value === "") return null;
//                 const parsed = parseFloat(value.toString().replace(',', '.'));
//                 return isNaN(parsed) ? null : Math.ceil(parsed * 10) / 10;
//             };

//             // Convert and validate data
//             const allData = rows
//                 .map(row => {
//                     // Handle missing time values
//                     if (!row.t) return null;

//                     const [hours, minutes, seconds] = row.t.split(":").map(Number);
                    
//                     // Validate time components
//                     if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
                    
//                     const timeInMinutes = hours * 60 + minutes + (seconds / 60);
                    
//                     // Create data point with validation
//                     const dataPoint = {
//                         time: timeInMinutes,
//                         HR: convertAndRound(row.HR),
//                         Power: convertAndRound(row.Power),
//                         VO2: convertAndRound(row.VO2),
//                         VCO2: convertAndRound(row.VCO2),
//                         Rf: convertAndRound(row.Rf),
//                         VT: convertAndRound(row.VT)
//                     };

//                     // Check if essential values are present
//                     if (dataPoint.time === null || 
//                         dataPoint.HR === null || 
//                         dataPoint.Power === null) {
//                         return null;
//                     }

//                     return dataPoint;
//                 })
//                 .filter(row => row !== null) // Remove null entries
//                 .sort((a, b) => a.time - b.time); // Sort by time

//             // Verify we have valid data before proceeding
//             if (allData.length === 0) {
//                 console.error('No valid data points found after parsing');
//                 return;
//             }

//             console.log('Old Results - Parsed Data:', allData);
//             lineGraphPowerHROld(allData);
//         },
//         error: function(error) {
//             console.error('Error parsing CSV:', error);
//         }
//     });
// }

// function lineGraphPowerHROld(data) {
//     if (!data || data.length === 0) {
//         console.error('No valid data provided');
//         return;
//     }

//     // Clear existing graph if any
//     d3.select("#linegraph-HR-Power-Old").select("svg").remove();

//     const margin = {top: 35, right: 62, bottom: 30, left: 60};
//     const width = 665 - margin.left - margin.right;
//     const height = 280 - margin.top - margin.bottom;

//     // Create SVG
//     const svg = d3.select("#linegraph-HR-Power-Old")
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

//     // Calculate domains with validation
//     const maxHR = d3.max(data, d => d.HR) || 200; // Fallback value if no valid max
//     const maxPower = d3.max(data, d => d.Power) || 400; // Fallback value if no valid max
//     const maxTime = d3.max(data, d => d.time) || 60; // Fallback value if no valid max

//     // Create scales
//     const x = d3.scaleLinear()
//         .domain([0, maxTime])
//         .range([0, width]);

//     const yLeft = d3.scaleLinear()
//         .domain([0, maxHR])
//         .range([height, 0]);

//     const yRight = d3.scaleLinear()
//         .domain([0, maxPower])
//         .range([height, 0]);

//     // Create line generators
//     const lineHR = d3.line()
//         .defined(d => !isNaN(d.HR) && d.HR !== null) // Skip invalid points
//         .x(d => x(d.time))
//         .y(d => yLeft(d.HR))
//         .curve(d3.curveMonotoneX);

//     const linePower = d3.line()
//         .defined(d => !isNaN(d.Power) && d.Power !== null) // Skip invalid points
//         .x(d => x(d.time))
//         .y(d => yRight(d.Power))
//         .curve(d3.curveMonotoneX);

//     // Add axes
//     svg.append("g")
//         .attr("transform", `translate(0,${height})`)
//         .call(d3.axisBottom(x)
//             .tickValues(d3.range(0, maxTime + 1, 120))
//             .tickFormat(d => {
//                 const hours = Math.floor(d / 60);
//                 const minutes = Math.floor(d % 60);
//                 return `${hours}:${minutes.toString().padStart(2, '0')}`;
//             }));

//     svg.append("g").call(d3.axisLeft(yLeft));
//     svg.append("g")
//         .attr("transform", `translate(${width},0)`)
//         .call(d3.axisRight(yRight));

//     // Add paths
//     svg.append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "#fb2618")
//         .attr("stroke-width", 1.5)
//         .attr("d", lineHR);

//     svg.append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "#2f79ce")
//         .attr("stroke-width", 1.5)
//         .attr("d", linePower);


//     // Create a tooltip
//     var Tooltip = d3.select("#linegraph-HR-Power-Old")
//         .append("div")
//         .style("opacity", 0)
//         .attr("class", "tooltip")
//         .style("background-color", "white")
//         .style("border", "solid")
//         .style("border-width", "2px")
//         .style("border-radius", "5px")
//         .style("padding", "5px")
//         .style("position", "absolute");

//     // Three functions that change the tooltip when user hover / move / leave a cell
//     var mouseover = function(event, d) {
//         Tooltip.style("opacity", 1);
//     };
//     var mousemove = function(event, d) {
//         // Convert time (minutes) to HH:mm format
//         var hours = Math.floor(d.time / 60);
//         var minutes = d.time % 60;
//         var formattedTime = hours + ":" + (minutes < 10 ? "0" : "") + minutes;

//         Tooltip
//             .html("Tijd: " + formattedTime + "<br>HR: " + d.HR + "<br>Power: " + d.Power)
//             .style("left", `${event.layerX + 10}px`)
//             .style("top", `${event.layerY}px`);
//     };
//     var mouseleave = function(event, d) {
//         Tooltip.style("opacity", 0);
//     };

//     // Add the points for HR
//     svg.selectAll(".dotHR")
//         .data(data)
//         .enter()
//         .append("circle")
//         .attr("class", "dotHR")
//         .attr("cx", function(d) { return x(d.time); })
//         .attr("cy", function(d) { return yLeft(d.HR); })
//         .attr("r", 3)
//         .attr("fill", "#fb2618")
//         .on("mouseover", mouseover)
//         .on("mousemove", mousemove)
//         .on("mouseleave", mouseleave);

//     // Add the points for Power
//     svg.selectAll(".dotPower")
//         .data(data)
//         .enter()
//         .append("circle")
//         .attr("class", "dotPower")
//         .attr("cx", function(d) { return x(d.time); })
//         .attr("cy", function(d) { return yRight(d.Power); })
//         .attr("r", 3)
//         .attr("fill", "#2f79ce")
//         .on("mouseover", mouseover)
//         .on("mousemove", mousemove)
//         .on("mouseleave", mouseleave);

//     //--------------------------------------- 
//     // Call the addPrestatiezones function
//     addPrestatiezones(svg, x, height); 
        
//     //---------------------------------------
//     // Add legend
//     svg.append("circle").attr("cx", width - 760).attr("cy", 20).attr("r", 6).style("fill", "#fb2618");
//     svg.append("circle").attr("cx", width - 760).attr("cy", 50).attr("r", 6).style("fill", "#2f79ce");
//     svg.append("text").attr("x", width - 740).attr("y", 20).text("HR").style("font-size", "15px").attr("alignment-baseline", "middle");
//     svg.append("text").attr("x", width - 740).attr("y", 50).text("Power").style("font-size", "15px").attr("alignment-baseline", "middle");

//     // Add Y axis label at the top left of the x-axis
//     svg.append("text")
//         .attr("x", -60)
//         .attr("y", -margin.top / 2)
//         .style("text-anchor", "start")
//         .style("font-size", "12px")
//         .style("font-weight", "bold")
//         .style("fill", "black")
//         .text("HR(bpm)");

//     // Add Y axis label at the top right of the x-axis
//     svg.append("text")
//         .attr("x", 580)
//         .attr("y", -margin.top / 2)
//         .style("text-anchor", "start")
//         .style("font-size", "12px")
//         .style("font-weight", "bold")
//         .style("fill", "black")
//         .text("Power(W)");

//     // Add X axis label at the bottom right of the x-axis
//     svg.append("text")
//         .attr("x", width)
//         .attr("y", height + margin.bottom - 1)
//         .style("text-anchor", "end")
//         .style("font-size", "12px")        
//         .style("font-weight", "bold")
//         .text("Tijd (min)");

// }

// // Call the function to read the data and plot the graph
// readOldResultsAndPlot();

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
// // Function to read data from the specified CSV file and call lineGraphPowerHR
// async function readOldResultsAndPlot() {
//     const filePath = 'data/26-01-2024-old-results-person1-dummy-data.csv';
//     const response = await fetch(filePath);
//     const data = await response.text();

//     Papa.parse(data, {
//         header: true,
//         skipEmptyLines: true,
//         complete: function(results) {
//             const rows = results.data;

//             // Function to convert and round values
//             const convertAndRound = (value) => Math.ceil(parseFloat(value.replace(',', '.')) * 10) / 10;

//             // Convert and round values for all rows
//             const allData = rows.map(row => ({
//                 t: row.t,
//                 HR: convertAndRound(row.HR),
//                 Power: convertAndRound(row.Power),
//                 VO2: convertAndRound(row.VO2),
//                 VCO2: convertAndRound(row.VCO2),
//                 Rf: convertAndRound(row.Rf),
//                 VT: convertAndRound(row.VT)
//             })).filter(row => 
//               !isNaN(row.HR) && 
//               !isNaN(row.Power) && 
//               !isNaN(row.VO2) && 
//               !isNaN(row.VCO2)&&
//               !isNaN(row.Rf) &&
//               !isNaN(row.VT)) ;

//             // Log the parsed data for debugging
//             console.log('Parsed Data:', allData);

//             // Call the lineGraphPowerHR function with the parsed data
//             lineGraphPowerHR(allData);
//         }
//     });
// }

// // Function to fetch data every minute and call lineGraphPowerHR
// function fetchDataEveryMinute(callback) {
//     readOldResultsAndPlot();
// }