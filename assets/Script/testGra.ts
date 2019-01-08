// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

type BezierObject = {
    pos1: cc.Vec2,
    pos2: cc.Vec2,
    pos3: cc.Vec2,
    pos4: cc.Vec2,
    con1: cc.Vec2,
    con2: cc.Vec2,
    con3: cc.Vec2,
    con4: cc.Vec2,
}

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property(cc.Node)
    balls: cc.Node[] = [];

    touchStartHandler: () => void;
    touchMoveHandler: () => void;
    touchEndHandler: () => void;
    touchCancelHandler: () => void;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

        cc.director.getPhysicsManager().enabled = true;
        // cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit |
        // cc.PhysicsManager.DrawBits.e_pairBit |
        // cc.PhysicsManager.DrawBits.e_centerOfMassBit |
        // cc.PhysicsManager.DrawBits.e_jointBit |
        // cc.PhysicsManager.DrawBits.e_shapeBit
        ;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -300);

        this.touchStartHandler = this.touchStart.bind(this);
        this.touchMoveHandler = this.touchMove.bind(this);
        this.touchEndHandler = this.touchEnd.bind(this);
        this.touchCancelHandler = this.touchCancel.bind(this);

        this.addTouch();
    }

    addTouch() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStartHandler);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMoveHandler);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEndHandler);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelHandler);
    }

    removeTouch() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStartHandler);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMoveHandler);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEndHandler);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelHandler);
    }


    metaball(radius1, radius2, center1, center2, handleSize = 2.4): BezierObject {
        const HALF_PI = Math.PI / 2;
        const d = cc.pDistance(center1, center2);
        const maxDist = radius1 + radius2 * 1.9;

        const v = (maxDist - d) / maxDist * 2.2  + 0.4
        
        let u1, u2;
        // No blob if a radius is 0
        // or if distance between the circles is larger than max-dist
        // or if circle2 is completely inside circle1
        if (radius1 === 0 || radius2 === 0 || d > maxDist || d <= Math.abs(radius1 - radius2)) {
              return null; 
        } 
        
        // Calculate u1 and u2 if the circles are overlapping
        if (d < radius1 + radius2) {
            u1 = Math.acos( (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d), );
            u2 = Math.acos( (radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d), );
        } else {
            // Else set u1 and u2 to zero
            u1 = 0; u2 = 0; 
        }
        
        // Calculate the max spread
        let angleBetweenCenters = cc.pAngle(cc.pSub(center1, center2), cc.p(-1, 0));
        if (center1.y > center2.y) {
            angleBetweenCenters = -angleBetweenCenters;
        }
        const maxSpread = Math.acos((radius1 - radius2) / d);
        
        // Angles for the points
        const angle1 = angleBetweenCenters + u1 + (maxSpread - u1) * v;
        const angle2 = angleBetweenCenters - u1 - (maxSpread - u1) * v;
        const angle3 = angleBetweenCenters + Math.PI - u2 - (Math.PI - u2 - maxSpread) * v;
        const angle4 = angleBetweenCenters - Math.PI + u2 + (Math.PI - u2 - maxSpread) * v;
        // Point locations
        const p1 = this.getVector(center1, angle1, radius1);
        const p2 = this.getVector(center1, angle2, radius1);
        const p3 = this.getVector(center2, angle3, radius2);
        const p4 = this.getVector(center2, angle4, radius2);
        
        // Define handle length by the distance between both ends of the curve
        const totalRadius = radius1 + radius2;
        const d2Base = Math.min(v * handleSize, cc.pDistance(p1, p3) / totalRadius);
        
        // Take into account when circles are overlapping
        const d2 = d2Base * Math.min(1, d * 2 / (radius1 + radius2));
        
        // Length of the handles
        const r1 = radius1 * d2;
        const r2 = radius2 * d2;
        
        // Handle locations
        const h1 = this.getVector(p1, angle1 - HALF_PI, r1);
        const h2 = this.getVector(p2, angle2 + HALF_PI, r1);
        const h3 = this.getVector(p3, angle3 + HALF_PI, r2);
        const h4 = this.getVector(p4, angle4 - HALF_PI, r2);
        
        // Generate the connector path
        
        return {
            pos1: p1,
            pos2: p2,
            pos3: p3,
            pos4: p4,
            con1: h1,
            con2: h2,
            con3: h3,
            con4: h4,
        }; 
    }

    getVector(vec: cc.Vec2, angle: number, radius: number) {
        let offX = radius * Math.cos(angle);
        let offY = radius * Math.sin(angle);

        return cc.p(vec.x + offX, vec.y + offY);
    }

    start () {

    }

    update (dt) {
        return;
        let gra = this.getComponent(cc.Graphics);
        gra.clear();
        gra.fillColor = cc.color(255, 255, 255);
        for (let i = 0; i < this.balls.length; i++) {
            let ball = this.balls[i];
            let bassPos1 = ball.position;

            let ballComp = ball.getComponent("cc.PhysicsCircleCollider") as cc.PhysicsCircleCollider;
            let radius1 = ballComp.radius * 1.2;


            gra.circle(bassPos1.x, bassPos1.y, radius1);
            gra.fill();
            for (let j = i; j < this.balls.length; j++) {
                if (i === j) {
                    continue;
                }
                let anotherBall = this.balls[j];
                let bassPos2 = anotherBall.position;
                let anotherBallComp = anotherBall.getComponent("cc.PhysicsCircleCollider") as cc.PhysicsCircleCollider;
                let radius2 = anotherBallComp.radius * 1.2;

                let bezierObj: BezierObject = null;
                if (bassPos1.y < bassPos2.y) {
                    bezierObj = this.metaball(radius1, radius2, bassPos1, bassPos2);
                } else {
                    bezierObj = this.metaball(radius2, radius1, bassPos2, bassPos1);
                }

                if (bezierObj) {
                    gra.moveTo(bezierObj.pos1.x, bezierObj.pos1.y);
                    gra.bezierCurveTo(bezierObj.con1.x, bezierObj.con1.y, bezierObj.con3.x, bezierObj.con3.y, bezierObj.pos3.x, bezierObj.pos3.y);
                    gra.lineTo(bezierObj.pos4.x, bezierObj.pos4.y);
                    gra.bezierCurveTo(bezierObj.con4.x, bezierObj.con4.y, bezierObj.con2.x, bezierObj.con2.y, bezierObj.pos2.x, bezierObj.pos2.y);
                    gra.lineTo(bezierObj.pos1.x, bezierObj.pos1.y);
                    gra.fill();
                }
            }
        }

    }


    touchStart(event : cc.Event.EventTouch) {
        
    }

    touchMove(event : cc.Event.EventTouch) {
        cc.log("lsdklsadklas");

        let radius1 = 50;
        let radius2 = 70;

        let gra = this.getComponent(cc.Graphics);
        gra.clear();

        gra.circle(480, 320, radius2);

        gra.circle(event.getLocationX(), event.getLocationY(), radius1);

        gra.fill();

        let bezierObj: BezierObject = this.metaball(radius2, radius1, cc.p(480, 320), cc.p(event.getLocationX(), event.getLocationY()));

        if (bezierObj) {
            gra.moveTo(bezierObj.pos1.x, bezierObj.pos1.y);
            gra.bezierCurveTo(bezierObj.con1.x, bezierObj.con1.y, bezierObj.con3.x, bezierObj.con3.y, bezierObj.pos3.x, bezierObj.pos3.y);
            gra.lineTo(bezierObj.pos4.x, bezierObj.pos4.y);
            gra.bezierCurveTo(bezierObj.con4.x, bezierObj.con4.y, bezierObj.con2.x, bezierObj.con2.y, bezierObj.pos2.x, bezierObj.pos2.y);
            gra.lineTo(bezierObj.pos1.x, bezierObj.pos1.y);
            
            gra.fill();
        }
    }

    touchEnd(event : cc.Event.EventTouch) {
        
    }

    touchCancel(event : cc.Event.EventTouch) {
    }
}
