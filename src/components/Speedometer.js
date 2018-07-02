// (c) Copyright 2018 SUSE LLC
/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import React, { Component } from 'react';
import { translate } from '../localization/localize.js';


/*
 * The following constants are here (in code instead of in CSS) so that they can be used in
 * calculations, especially those that determine the overall size of the graph.
 */

/*
 * Stroke width of the danger arc, which is the outer-most (largest) component in the graph.
 */
const DANGER_STROKE_WIDTH = 2;
/*
 * Distance from the center of the value arc line to the center of the danger arc.  This value is
 * somewhat dependent on the stroke width of the value arc that it set in CSS; if the value arc
 * stroke width is made significantly wider than it currently is, then it may fill and overflow this
 * gap
 */
const DANGER_GAP = 7;

export class Speedometer extends Component {

  /*
   * This component is made up of an SVG drawing plus a smattering of labels: a header at the top, a
   * value in the middle, and a caption at the bottom.  The trickiest part is the graph, especially
   * calcalating the coordinates for where the arcs and points are to be drawn, since we are going
   * to draw arcs with two different radii, and since the size, rotation and range of the chart is
   * configurable.  To make all of this math simple, we take advantage of svg's ability to compose
   * things in one coordinate system and then transform them to another.  Circles (and arcs) are
   * more naturally handled in the standard mathematical coordinate system centered around the
   * origin (0,0), with all angles originating on the positive x-axis and increasing
   * counterclockwise.  SVG scaling, translation, and rotation are then used to move that graph to
   * its final position and orientation.
   *
   * The order of the arguments in a couple of methods in this class where the radius is the last
   * argument is done to permit the radius to be an optional parameter; JavaScript requires that
   * optional parameters come after required ones.
   *
   * The props that are supported by this component are documented after the end of the component
   */

  /*
   * Simple function to calculate how much of a full circle that this graph will take (on a scale
   * from 0 to 1), based on the difference between the start angle and end angle.  For example, if
   * the chart is to be drawn (as a semicircle) from 180 degrees to 0 degrees, it will be 0.5 of a
   * full circle.  This value is then used to scale all points along the circle accordingly.
   */
  getCirclePortion = () => {
    let range = this.props.startAngle - this.props.endAngle;
    if (range < 0) {
      range += 360;
    }
    return range / 360;
  }

  /*
   * Return the (x,y) coodinates (as an array) for the given "normalized" value.  A "normalized"
   * value in this context is one whose value ranges from 0 to 100, which is basically a
   * percentage.  This scale was arbitrarily chosed, and we could have instead chosen any other
   * range, like 0 to 1, but 0 to 100 is pretty simple to envision, and is also the default
   * for things like html range inputs.
   *
   * The (x,y) returned here will be for the point on the arc of a circle whose center is at
   * (0,0) and whose angle starts on the positive x-axis and goes around the circle counterclockwise.
   * Therefore, if the graph were configured to use the entire circle and the normalized input value
   * were 25 (i.e 25% of the way around), then it would return coordinates of the top of the circle
   * (0,r). Actually, since screen coordinates normally increase as you go down the screen, we will
   * actually return (0,-r) in this situation.
   *
   * This function is basically little more than a standard conversion of polar coordinates (r,
   * theta) into cartesian coordinates (x,y), but twist here is that we expect a normalized value
   * (0-100) rather than an angle in radians.  The reason to have the input be a normalized value
   * instead of an angle in radians is to avoid littering this entire class with all sorts of
   * calculations involving 2*PI.
   */
  getArcPoint = (normValue, radius=this.props.radius) => {

    // Make sure we stay within the confines of the graph
    if (normValue > 100) {
      normValue = 100;
    } else if (normValue < 0) {
      normValue = 0;
    }

    // Scale according to how much of the circle is being used.  Thus a value of 50 when
    // using a semicircle is equivalent to 25% of a full circle.
    normValue *= this.getCirclePortion();

    // convert the given value to an angle in radians
    const angle = (normValue / 100) * 2 * Math.PI;

    // convert to cartesian coordinates. multiply y coordinate by -1 to handle the fact that the
    // screen y-coordinates are backward
    return [radius * Math.cos(angle), -1 * radius * Math.sin(angle)];
  }

  /*
   * Calculate the SVG path for a circular arc (with the given radius), from one normalized value to
   * another.  The normalized "from" and "to" values should range from 0 to 100, where 0 represents
   * 0 degrees, or the point along the positive x-axis.  The path will use the same coordinate
   * system as those returned getArcPoint().
   *
   * The W3C SVG doc [1] is the definitive guide for the Path element and its "M" (moveto) and "A"
   * (Elliptical Arc) commands.
   *
   * [1] https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
   */
  getPath = (from, to, radius=this.props.radius) => {

    const range = (to - from) * this.getCirclePortion();

    /* eslint-disable indent */
    // Draw a portion of a circle, centered at the origin, and starting at (r,0)
    const path = [
      'M', ...this.getArcPoint(from, radius),   // Move to the "from" point to start drawing from there
      'A', radius, radius,       // x- and y-radii of arc (using same value yields a circular arc)
           0,                    // x-axis-rotation -- irrelevant for circular arcs, so just use 0
           range > 50 ? 1 : 0,   // large arc?  Yes if drawing more than 50% of the circle.  See [1] for more info
           0,                    // sweep direction?  Always draw in standard CCW direction (0)
           ...this.getArcPoint(to, radius)];  // Coordinates for the end of the arc
    /* eslint-enable indent */

    return path.join(' ');       // SVG expects space delimited args rather than an array of values
  }

  /*
   * Render the entire speedometer include its svg graph and the labels
   */
  render = () => {

    // Several parts of the speedometer are suppressed when there is no value; more precisely, when
    // props.value is undefined. Capture this condition in a meaningful variable.
    const haveValue = this.props.value !== undefined;

    let normValue;       // Value to be graphed, normalized to the range 0-100 (where max is 100)
    let displayValue;    // String to be displayed in the center of the speedometer
    let usedLabel;       // The word "USED", to appear below the value displayValue
    let defaultCaption;  // Caption at the bottom to be used if props.caption is undefined

    if (haveValue) {

      // Create normalized value for controlling how much of the arc to draw
      normValue = this.props.value * 100 / this.props.max;

      // Format the property value to the appropriate number of decimals.  This may be used in both
      // the center of the graph (displayValue) and in the caption
      const formattedValue = Number(this.props.value).toFixed(this.props.decimals);

      if (this.props.displayAsPercent) {
        const percentValue = Number(100 * this.props.value / this.props.max).toFixed(this.props.decimals);
        displayValue = translate('speedometer.percentage', percentValue);
      } else {
        displayValue = formattedValue;
      }

      if (this.props.units) {
        defaultCaption = translate('speedometer.caption', formattedValue, this.props.max, this.props.units);
      }

      usedLabel = translate('speedometer.used');
    }

    //Calculate the normalized value of where the danger area begins
    const normDanger = this.props.danger * 100 / this.props.max;

    // Calculate the x-y coordinates of the point where the normalized value should be.  This is
    // where the little circle will be drawn and where the arc extends to.
    const [valuex, valuey] = this.getArcPoint(normValue || 0);

    // If the props.caption is defined, then use it.  Otherwise use the default caption from above
    const caption = (this.props.caption !== undefined) ? this.props.caption : defaultCaption;

    // The width of the danger arc is defined here (in code) rather than in the css because it is
    // used programatically to determine the size of the speedometer
    const dangerStyle = {
      strokeWidth: DANGER_STROKE_WIDTH
    };

    // CSS classes to attach to the various parts of the speedometer which enable things like colors
    // and tick marks to be controlled via styles
    const dangerCls = (normValue > normDanger) ? 'danger' : '';
    const valueCls = 'value-arc ' + dangerCls;
    const circleCls = dangerCls;

    // Calculate the radius of the midpoint of the "danger" arc line
    const danger_radius = this.props.radius + DANGER_GAP;

    // Cacluate the outermost edge of the danger arc line
    const danger_outer_radius = danger_radius + (DANGER_STROKE_WIDTH/2);

    // The svg graph size will be double the danger
    const graph_size = danger_outer_radius * 2;

    /*
     * In the innermost section (below), 4 elements are being drawn: the ticks (an arc), danger arc,
     * value arc, and a circle that repreents the current value.  These are all being drawn in the
     * standard mathematical coordinate system centered around the origin (0,0), with all angles
     * originating on the positive x-axis and increasing counterclockwise.
     *
     * Prepare two svg transforms to render the graph in its final orientation.
     * 1. The first (the <g> grouping element) has a translation with two parts:
     *     a. scale(-1, 1).  This flips the graph horizontally (a reflection around the y-axis),
     *        causing the arcs to start on the negative x-axis and increase in a clockwise direction
     *     b. rotate(start-180).  This rotates the arcs (and value circle) so that they start
     *        at the appropriate start angle.  Since this happens after flipping the graph 0 degrees
     *        is now where 180 is, so we have to subtract 180 from the start angle.
     *
     * At this point all of labels and text are added, with the arcs still being centered at (0 ,0)
     *
     * 2. The second (outermost) transform just translates (re-centers) the whole speedemeter+labels
     *    so that it is entirely in positive screen coordinates, i.e. it moves it down and to the right
     *    by half of the chart's width.
     */

    const transformArcs = 'scale(-1,1) ' +                           // flip horizontally
                          `rotate(${this.props.startAngle-180}) `;   // spin to start angle

    const recenter = `translate(${danger_outer_radius},${danger_outer_radius})`;  // re-center the whole thing


    return (
      <div className="speedometer">
        <div className="header">
          {this.props.title || undefined}
        </div>
        <figure>
          <svg height={graph_size} width={graph_size} >
            <g transform={recenter}>
              {/* Draw text first (before the svg graph).  If the text is drawn aftwards, the
                corners of its bounding box may cover up part of the graph */}
              <text x="0" y="10" className="value">{displayValue}</text>
              <text x="0" y="25" className="used">{usedLabel}</text>

              <g transform={transformArcs}>
                <path className="ticks" d={this.getPath(0, 100)} />
                <path className="danger-arc" style={dangerStyle} d={this.getPath(normDanger, 100, danger_radius)} />
                {/* Only draw the value arc and circle when we have a value */}
                { haveValue? <path className={valueCls} d={this.getPath(0, normValue || 0)} /> : undefined }
                { haveValue? <circle className={circleCls} cx={valuex} cy={valuey} r={5} /> : undefined }
              </g>
            </g>
          </svg>
          <figcaption>
            {caption}
          </figcaption>
        </figure>
      </div>
    );
  }
}


Speedometer.defaultProps = {

  /*
   * Value to be rendered on the speedometer.  The minimum value is 0, and its max is defined by
   * the max property.  If this value is undefined, then several parts of the speedometer will not
   * be shown including the value arc and circle, and the labels in the center of the speedometer.
   */
  value: undefined,

  /*
   * Radius of the value arc.  The stroke width of this arc is controlled via a CSS style.  The
   * danger arc will be a bit outside of this arc.
   */
  radius: 60,

  /*
   * Start angle (0-360) for where the arcs should begin, with 0 being to the right and increasing
   * CCW, like the normal math convention.  i.e., 90 would be at the top center of the circle.  The
   * default is in the lower left quadrant.
   */
  startAngle: 229,

  /*
   * End angle (0-360) for where the arcs should end, with 0 being to the right and increasing
   * CCW, like the normal math convention.  i.e., 270 would be at the bottom center of the circle.
   * The default is in the lower right quadrant.
   */
  endAngle: 311,

  /*
   * Maximum value of the speedometer.  This affects the scaling of the speedometer, and this value
   * is also rendered in the default caption.
   */
  max: 100,

  /*
   * Value for where the "danger" arc should begin.  When the value exceeds this number, the value
   * arc will be drawn in a different color (nominally red, but controlled via a css style).  If
   * this property is set to be greater than or equal to the max property, then it will not be
   * rendered nor will the value arc change color
   */
  danger: 85,


  /*
   * Should the label in the center of the graph be converted to a percentage of max?
   */
  displayAsPercent: true,

  /*
   * Number of digits after the decimal point that the value (and/or percentage) should be
   * rendered with.
   */
  decimals: 0,

  /*
   * Title to go above the graph.  If this is either undefined or the empty string, no
   * title will be displayed, and the graph will be shifted up
   */
  title: undefined,

  /*
   * Caption to go below the graph.  If this is undefined, then a reasonable default
   * string will be shown that includes the value, its units (if any) and the total.
   * If the value is the empty string or just spaces, then no caption will be displayed and
   * the overall size of the speedometer component will be smaller.
   */
  caption: undefined,

  /*
   * Units to be displayed in the default caption when no explicit caption is defined.
   */
  units: undefined,
};
