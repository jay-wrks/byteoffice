# Byte Office — Java / ByteBot Branch

This branch changes Byte Office from a tile-programming game into a real Java programming game while keeping the existing robot, factory, floor-memory, roadmap, animation and level systems.

## Player contract

Players do **not** write `main()`. Byte Office owns application startup and invokes this method:

```java
import byteoffice.ByteBot;

public class Program {
    public void program(ByteBot bot) {
        // player Java
    }
}
```

`Program.java` is otherwise normal Java 8. Players may use variables, methods, helper classes, arrays, collections, recursion and the Java standard library.

The puzzle restriction exists only at the `ByteBot` boundary. Box values are never returned to Java, so Java variables cannot be used as invisible storage for INPUT or floor-box values.

## ByteBot API

```java
bot.take();
bot.send();

bot.copyTo(0);
bot.copyFrom(0);
bot.place(0);
bot.pick(0);

bot.add(0);
bot.subtract(0);

bot.hasNext();
bot.isZero();
bot.isNegative();
bot.isHolding();
bot.memorySize();
bot.isEmpty(0);
```

The physical data operations return `void`. There is deliberately no `getValue()`, `peekValue()`, `getFloorValue()` or equivalent API.

Example:

```java
public void program(ByteBot bot) {
    while (bot.hasNext()) {
        bot.take();
        bot.copyTo(0);

        if (!bot.hasNext()) {
            bot.send();
            return;
        }

        bot.take();
        bot.add(0);
        bot.send();
    }
}
```

## Browser-only Java

There is no Byte Office application server.

The browser loads CheerpJ 4.3 and starts a Java 8 JVM in WebAssembly. The bundled `java/tools.jar` compiler runs inside CheerpJ. Byte Office writes these sources into that filesystem:

- the player's `Program.java`
- the protected `byteoffice.ByteBot` API
- Byte Office's hidden `GameRunner`

`javac` compiles them in the browser and CheerpJ executes `GameRunner`. `GameRunner` creates the player's `Program` class and calls `program(ByteBot bot)`.

Native `ByteBot` operations bridge back into the existing JavaScript machine/animation pipeline. For example, `bot.take()` triggers the same physical INBOX pickup animation as the old `READ` instruction, and `bot.copyTo(0)` triggers the existing COPYTO animation.

## Running locally

CheerpJ does not support opening this branch directly through `file://`. Serve the repository with any static HTTP server. This is still serverless application logic; the HTTP server only serves static files.

For example:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

No Node build, backend API, Docker container or Java installation is required on the player's computer.

An internet connection is currently required to load the CheerpJ runtime from its CDN.

## Java execution model

`ByteBot` owns the physical game state:

- one held box
- the level's exact number of floor-memory slots
- INPUT
- OUTPUT
- physical arithmetic and comparisons

Java owns normal program state:

- local variables and fields
- loops and conditions
- methods
- classes and objects
- arrays and collections
- normal Java algorithms

A player can therefore write normal Java such as counters and helper classes, but this is intentionally impossible:

```java
int value = bot.take();      // compile error: take() returns void
int hidden = bot.getValue(); // compile error: no such method
```

## Structure

```text
ByteOffice/
├── index.html
├── components/
│   └── program-panel.js        # Java editor shell
├── css/
│   └── java-mode.css           # Java editor + ByteBot API styling
├── js/
│   ├── java/
│   │   └── java-mode.js        # JVM/compiler/native ByteBot integration
│   ├── core/engine.js          # retained legacy state model
│   ├── data/levels.js          # existing assignments and physical memory limits
│   └── app/
│       ├── scene.js            # existing machine rendering
│       ├── robot-actions.js    # existing physical animations
│       ├── runner-feedback.js  # existing success/error effects
│       └── bindings.js         # Java-aware Run/Step controls
└── assets/
```

## Important

The script order in `index.html` is deliberate. `js/java/java-mode.js` loads after the existing machine/animation helpers and before `js/app/bindings.js`, allowing Java mode to reuse the mature physical animation code while replacing the old tile editor and execution controls.
