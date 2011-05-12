import java.io.*;
import java.util.*;
import org.json.*;
public class Main {
    public Hashtable<String, String> table = new Hashtable<String, String>();
    public class Coord{
        int x, y;
        String dir;
        public Coord(int x1, int y1){
            x = x1;
            y = y1;
        }
        public Coord(int x1, int y1, String d){
            x = x1;
            y = y1;
            dir = d;
        }
    }
     public Coord nextDirect(String direct, String curDir){
        int x = 0, y = 0;
        String newDir = "";
        if (direct.equals("forward")){
            if (curDir.equals("up")){
                x = 0;
                y = -1;
                newDir = "up";
            }
            else if (curDir.equals("down")){
                x = 0;
                y = 1;
                newDir = "down";
            }
            else if (curDir.equals("left")){
                x = -1;
                y = 0;
                newDir = "left";
            }
            else if (curDir.equals("right")){
                x = 1;
                y = 0;
                newDir = "right";
            }
            else if (curDir.equals("wait")){
                x = 0;
                y = 0;
                newDir = "forward";
            }
        }
        else if (direct.equals("left")){
            if (curDir.equals("up")){
                x = 0;
                y =0;
                newDir = "left";
            }
            else if (curDir.equals("down")){
                x = 0;
                y = 0;
                newDir = "right";
            }
            else if (curDir.equals("left")){
                x = 0;
                y = 0;
                newDir = "down";
            }
            else if (curDir.equals("right")){
                x = 0;
                y = 0;
                newDir = "up";
            }
            else if (curDir.equals("wait")){
                x = -1;
                y = 0;
                newDir = "left";
            }
        }
        else if (direct.equals("right")){
            if (curDir.equals("up")){
                x = 0;
                y =0;
                newDir = "right";
            }
            else if (curDir.equals("down")){
                x = 0;
                y = 0;
                newDir = "left";
            }
            else if (curDir.equals("left")){
                x = 0;
                y = 0;
                newDir = "up";
            }
            else if (curDir.equals("right")){
                x = 0;
                y = 0;
                newDir = "down";
            }
            else if (curDir.equals("wait")){
                x = 1;
                y = 0;
                newDir = "right";
            }
        }
        else if (direct.equals("wait")){
            if (curDir.equals("up")){
                x = 0;
                y =0;
                newDir = "up";
            }
            else if (curDir.equals("down")){
                x = 0;
                y = 0;
                newDir = "down";
            }
            else if (curDir.equals("left")){
                x = 0;
                y = 0;
                newDir = "left";
            }
            else if (curDir.equals("right")){
                x = 0;
                y = 0;
                newDir = "right";
            }
            else if (curDir.equals("wait")){
                x = 0;
                y = 0;
                newDir = "wait";
            }
        }
        return new Coord(x, y, newDir);
    }
    public class Path{
        String dir;
        int x, y, initCnt, cnt;
        public Path(String d, int x1, int y1, int initC){
            dir = d;
            x = x1;
            y = y1;
            initCnt = initC;
            cnt = 0;
        }
    }
    public class Cell{
        public int x, y;
        public int zIndex;
        public int points, dLife;
        public Cell(){};
        public Cell(int x1, int y1, int z, int pnts, int d){
            x = x1;
            y = y1;
            zIndex = z;
            points = pnts;
            dLife = d;
        }
    }
    public class Monster extends Cell{
       public ArrayList<Path> path = new ArrayList<Path>();
       public int index;
       public boolean looped;
       public boolean die;
       public Monster(JSONObject monster) throws JSONException{
           super();
           JSONArray p = (JSONArray)monster.getJSONArray("path");
           looped = monster.getBoolean("looped");
           die = monster.getBoolean("die");
           for (int i = 0; i < p.length(); ++i){
               JSONObject obj = (JSONObject)(p.get(i));
               Path t = new Path(obj.getString("dir"), obj.getInt("x"), obj.getInt("y"),
                       obj.getInt("initCnt"));
               path.add(t);
           }
           index  = 0;
           x = path.get(0).x;
           y = path.get(0).y;
           if (monster.has("zIndex"))
               zIndex = monster.getInt("zIndex");
           else zIndex = 3;
           points = 0;
           dLife = 0;
       }
       public Coord tryNextStep(){
         String dir = path.get(index).dir;
         int x1 = x, y1 = y;
         Coord c = new Coord(0, 0);
         if ((index == path.size() - 1) && path.get(index).cnt ==
             path.get(index).initCnt){
             if (!looped)
                 return new Coord(x, y);
             x1 = path.get(0).x;
             y1 = path.get(0).y;
             dir = path.get(0).dir;
         }
         else{
             if (path.get(index).cnt == path.get(index).initCnt)
                dir = path.get(index + 1).dir;

           }
         c = nextDirect("forward", table.get(dir));
         return new Coord(x1 + c.x, y1 + c.y);
       }
       public void nextStep(){
         Coord c = new Coord(0, 0);
         if ((index == path.size() - 1) && path.get(index).cnt ==
             path.get(index).initCnt){
             if (!looped)
                 return;
             index = 0;
             for (int i = 0; i < path.size(); ++i)
                path.get(i).cnt = 0;
         }
         else{
             if (path.get(index).cnt == path.get(index).initCnt)
                ++index;
           }
         c = nextDirect("forward", table.get(path.get(index).dir));
         x += c.x;
         y += c.y;
         ++path.get(index).cnt;
       }
    }
    public class Lock extends Cell{
        public boolean locked;
        public Lock(int x, int y){
            super(x, y, 11, 0, 0);
        }
    }
    public class Key extends Cell{
        public Lock[] locks;
        public  boolean found;
        public Key(int x, int y, int l){
            super(x, y, 1, 0, 0);
            locks = new Lock[l];
            found = false;
        }
    }
    public class Box extends Cell{
        public Box(int x, int y, JSONObject box) throws JSONException{
            super(x, y, box.has("zIndex") ? box.getInt("zIndex") : 2,
                    box.has("points") ? box.getInt("points") : 0,
                    box.has("dLife") ? box.getInt("dLife") : 0);
        }
    }
    public class Prize extends Cell{
        public boolean found;
        public Prize(int x, int y, JSONObject prize) throws JSONException{
            super(x, y, prize.has("zIndex") ? prize.getInt("zIndex") : 1,
                    prize.has("points") ? prize.getInt("points"): 0,
                    prize.has("dLife") ? prize.getInt("dLife") : 0);
            found = false;
        }
    }
    public class FieldElem{
        public int x, y;
        public boolean isWall;
        public ArrayList<Cell> cells = new ArrayList<Cell>();
        public FieldElem(int x1, int y1, boolean wall){
            x = x1;
            y = y1;
            isWall = wall;
        }
        public boolean mayPush(Cell cell){
            if (isWall)
                return false;
            for (int i = 0; i < cells.size(); ++i)
                if (cells.get(i).zIndex >= cell.zIndex)
                    return false;
            return true;
        }
    }
    private PrintWriter out = null;
    private Scanner in = null;
    private int curX, curY, dx, dy, curI = 1, arrowZIndex = 3;
    private int dLife = 0, startLife = 0, startPoints = 0, life = 0, pnts = 0, maxStep = 99999999, maxCmdNum = 99999999, steps = 0;
    private JSONArray map, specSymbols, keys, locks, movingElements, sol;
    private boolean dead = false;
    String[][] curMap;
    String[] specSymbolsList;
    String curDirect;
    Monster[] monsters;
    FieldElem[][] field;
    void swap(ArrayList<Cell> arr, int i, int j) {
        Cell t = arr.get(i);
        arr.set(i, arr.get(j));
        arr.set(j, t);
    }
    public void sort(ArrayList<Cell> arr){
      for(int i = arr.size() - 1 ; i >= 0 ; i--)
            for(int j = 0 ; j < i ; j++)
                if(arr.get(j).zIndex < arr.get(j + 1).zIndex)
                   swap(arr, j, j+1);
    }
    public boolean nextStep(int i, String direct){
        boolean result = true;
        try{
        Coord c = nextDirect(direct, curDirect);
        dx = c.x;
        dy = c.y;
        curDirect = c.dir;
        life  += dLife;
        int c_x = curX + dx;
        int c_y = curY + dy;
        boolean changeCoord = true;
        if (!(c_x < 0 || c_x >= field[0].length || c_y < 0 || c_y >= field.length)){
            FieldElem elem = field[c_y][c_x];
            if (elem.isWall)
                changeCoord = false;
            sort(elem.cells);
            for (int j = 0; j < elem.cells.size(); ++j){
                if (elem.cells.get(j).x != c_x || elem.cells.get(j).y != c_y)
                    continue;
                if (elem.cells.get(j) instanceof Lock &&
                    ((Lock)elem.cells.get(j)).locked){
                    changeCoord = false;
                    break;
                }
                if (elem.cells.get(j) instanceof Monster){
                    result = false;
                    return result;
                }
                if (elem.cells.get(j) instanceof Box){
                    int tx = c_x + dx;
                    int ty = c_y + dy;
                    boolean f = tx < 0 || tx >= field[0].length || ty < 0 || ty >= field.length;
                    Box box = (Box)elem.cells.get(j);
                    if (!f){
                        FieldElem el1 = field[ty][tx];
                        if (el1.mayPush(box)){
                            elem.cells.remove(box);
                            box.x = tx;
                            box.y = ty;
                            el1.cells.add(box);
                            pnts += box.points;
                            life += box.dLife;
                            continue;
                        }
                         else
                            changeCoord = false;
                    }
                    else
                        changeCoord = false;
                }
                if (elem.cells.get(j) instanceof Prize && !((Prize)elem.cells.get(j)).found){
                    ((Prize)elem.cells.get(j)).found = true;
                    pnts += elem.cells.get(j).points;
                    life += elem.cells.get(j).dLife;
                }
                if (elem.cells.get(j) instanceof Key && !((Key)elem.cells.get(j)).found){
                    Key key = ((Key)elem.cells.get(j));
                    key.found = true;
                    for (int l = 0; l < key.locks.length; ++l){
                        key.locks[l].locked = false;
                        key.locks[l].zIndex = 0;
                    }
                }
            }
        }
         else
            changeCoord = false;
        if (changeCoord){
            curX = c_x;
            curY = c_y;
        }
        for (int k = 0; k < monsters.length; ++k){
            Monster monster = monsters[k];
            Coord c1 = monster.tryNextStep();
            if (field[c1.y][c1.x].mayPush(monster)){
                if (c1.y == curY && c1.x == curX){
                    result = false;
                    return result;
                }
                field[monster.y][monster.x].cells.remove(monster);
                monster.nextStep();
                field[c1.y][c1.x].cells.add(monster);
            }
        }
        if (life == 0 || ++steps > maxStep){
            result = false;
            return result;
        }
        } catch (Exception exept) {
          exept.printStackTrace();
          System.exit(216);
        }
        return result;
    }
    private void myAssert(boolean expr, String message) {
        if (!expr) {
          System.err.println("Incorrect input!!! " + message);
          System.exit(216);
        }
    }
    public void solve(String[] args){
        try {
            table.put("U", "up");
            table.put("D", "down");
            table.put("L", "left");
            table.put("R", "right");
            String output = "output.txt";
            File file = new File("problem.json");
            FileInputStream fis  = new FileInputStream(file);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            int a;
            while ((a=fis.read())!=-1)
                baos.write(a);
            String fileInString = baos.toString("utf-8");
            JSONObject problem = new JSONObject(fileInString);
            if (problem.has("startLife"))
                life = problem.getInt("startLife");
            if (problem.has("dLife"))
                dLife = problem.getInt("dLife");
            if (problem.has("maxCmdNum"))
                maxCmdNum = problem.getInt("maxCmdNum");
            else if (problem.has("maxStep"))
		maxStep = problem.getInt("maxStep");
            if (problem.has("startPoints"))
                startPoints = problem.getInt("startPoints");
            pnts = startPoints;
            myAssert(problem.has("map"), "Map is undefined");
            map = problem.getJSONArray("map");
            if (problem.has("specSymbols"))
                specSymbols = problem.getJSONArray("specSymbols");
            if (problem.has("keys")){
                keys = problem.getJSONArray("keys");
                myAssert(problem.has("locks"), "Keys are defined, but locks cells aren't defined");
                locks = problem.getJSONArray("locks");
                myAssert(keys.length() == locks.length(), "Keys and locks length aren't equal");
            }
            if (problem.has("movingElements"))
                movingElements = problem.getJSONArray("movingElements");
            curMap=new String[map.length()][((JSONArray)((JSONArray)map).get(0)).length()];
            field = new FieldElem[curMap.length][curMap[0].length];
            for (int i = 0; i < map.length(); ++i)
                for (int j = 0; j < ((JSONArray)((JSONArray)map).get(i)).length(); ++j){
                    Cell obj;
                    curMap[i][j] =(String)(((JSONArray)((JSONArray)map).get(i)).get(j));
                    field[i][j] = new FieldElem(i, j, curMap[i][j].equals("#"));
                    if (curMap[i][j].equals("R")|| curMap[i][j].equals("U") || curMap[i][j].equals("D") || curMap[i][j].equals("L")){
                        curY = i;
                        curX = j;
                        curDirect = table.get(curMap[i][j]);
                    }
                    for (int k = 0; k < specSymbols.length(); ++k){
                        if (curMap[i][j].equals(((JSONObject)specSymbols.get(k)).getString("symbol"))){
                            obj = ((JSONObject)specSymbols.get(k)).getString("action").equals("eat") ?
                                new Prize(j, i, (JSONObject)specSymbols.get(k)):
                                new Box(j, i, (JSONObject)specSymbols.get(k));
                                field[i][j].cells.add(obj);
                                break;
                            }
                    }
                }
            monsters = new Monster[movingElements.length()];
            for (int k = 0; k < movingElements.length(); ++k){
                Monster obj = new Monster((JSONObject)movingElements.get(k));
                field[obj.y][obj.x].cells.add(obj);
                monsters[k] = obj;
            }
            for (int k = 0; k < keys.length(); ++k){
                Key key = new Key(((JSONObject)keys.get(k)).getInt("x"),
                        ((JSONObject)keys.get(k)).getInt("y"), ((JSONArray)locks.get(k)).length());
                field[key.y][key.x].cells.add(key);
                for (int j = 0; j < ((JSONArray)locks.get(k)).length(); ++j){
                    Lock lock = new Lock(((JSONObject)((JSONArray)locks.get(k)).get(j)).getInt("x"),
                            ((JSONObject)((JSONArray)locks.get(k)).get(j)).getInt("y"));
                    key.locks[j] = lock;
                    field[lock.y][lock.x].cells.add(lock);
                }
            }
            fis.close();
            file = new File("output.txt");
            fis  = new FileInputStream(file);
            baos = new ByteArrayOutputStream();
            a = 0;
            while ((a=fis.read())!=-1)
                baos.write(a);
            fileInString = baos.toString("utf-8");
            sol = new JSONArray(fileInString);
            for (int i = 0; i < sol.length(); ++i){
                if (i + 1 > maxCmdNum)
                        break;
                String direct = ((JSONObject)sol.get(i)).getString("dir");
                Integer cnt = ((JSONObject)sol.get(i)).getInt("cnt");
                int j = 0;
                for (j = 0; j < cnt; ++j)
                    if (!nextStep(curI++, direct))
                        break;
                if (j != cnt)
                    break;
            }
            System.out.print(pnts);
    } catch (Exception exept) {
          exept.printStackTrace();
          System.exit(216);
    }
    }
    public static void main(String[] args) {
      try {
       Main app = new Main();
       app.solve(args);
    } catch (Exception exept) {
          exept.printStackTrace();
          System.exit(216);
    }
    }
}