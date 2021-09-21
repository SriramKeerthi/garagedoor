$fn = 50;
width = 60;
height = 24;
depth = 53+2;
notchR = 1.9;
thickness = 2;
powerDepth = 7;
powerHeight = 4;
controllerDepth = 30;
controllerWidth = 31;
module mainCase() {
    difference() {
        union() {
            difference() {
                minkowski() {
                    cube([width, depth, height]);
                    sphere(2);
                }
                cube([width, depth, height]);
            }
            translate([0,-2,0])
            difference() {
                cube([width, 4, height]);
                translate([width*0.05, 0, height/6])
                cube([width*0.9, 4.1, height/1.5]);
                translate([width*0.7, 0, height/3])
                cube([width*0.2, 4.1, height/1.5]);
            }
            translate([notchR-0.1,depth - controllerDepth/2,-0.1])
            cylinder(height+0.2, notchR, notchR);
            
            translate([0,depth - controllerDepth - 0.2, height - 2.9])
            cube([controllerWidth, 1, 3]);
        }
        translate([0,-2.05,0])
        cube([width, 2.1, height]);
        
        translate([-4,2,0])
        cube([10, powerDepth, powerHeight]);
        
        translate([controllerWidth-2,depth-controllerDepth/2,height-0.1]) 
        cylinder(1,2,2);
        
        translate([width-8, 21, height-0.1])
        cylinder(1,2,2);

        translate([width-18, 21, height-0.1])
        cylinder(1,2,2);
    }
}

module cap() {
    translate([0,-2.05,0])
    difference() {
        cube([width, 2, height]);
        
        translate([-10,-0.1,0])
        rotate([0,45,0])
        cube(10);
    }
}

mainCase();

//cap();