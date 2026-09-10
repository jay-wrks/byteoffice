(function(){
  'use strict';

  function trimBlankLines(value){
    return String(value).replace(/^\s*\n/,'').replace(/\n\s*$/,'');
  }

  function solution(body,helpers=''){
    const formattedBody=trimBlankLines(body);
    const formattedHelpers=trimBlankLines(helpers);
    const helperBlock=formattedHelpers ? `\n${formattedHelpers}\n` : '';
    return `import byteoffice.ByteBot;\n\npublic class Program {\n    public void program(ByteBot bot) {\n${formattedBody}\n    }${helperBlock}\n}\n`;
  }

  const S={
    1:solution(`        bot.take();\n        bot.send();`),

    2:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.send();\n        }`),

    3:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n\n            bot.take();\n            bot.send();\n\n            bot.pick(0);\n            bot.send();\n        }`),

    4:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.add(0);\n            bot.send();\n        }`),

    5:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.copyTo(1);\n\n            bot.copyFrom(0);\n            bot.subtract(1);\n            bot.send();\n        }`),

    6:solution(`        while (bot.hasNext()) {\n            bot.take();\n\n            if (!bot.isNegative()) {\n                bot.send();\n            }\n        }`),

    7:solution(`        while (bot.hasNext()) {\n            bot.take();\n\n            if (!bot.isZero()) {\n                bot.send();\n            }\n        }`),

    8:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n\n            bot.take();\n            bot.send();\n        }`),

    9:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n            bot.send();\n\n            bot.copyFrom(0);\n            bot.send();\n        }`),

    10:solution(`        bot.take();\n        bot.copyTo(0);\n        bot.send();\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.add(0);\n            bot.copyTo(0);\n            bot.send();\n        }`),

    11:solution(`        while (bot.hasNext()) {\n            bot.take();\n\n            if (bot.isNegative()) {\n                bot.copyTo(0);\n                bot.subtract(0);\n                bot.subtract(0);\n            }\n\n            bot.send();\n        }`),

    12:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n            bot.send();\n\n            bot.copyFrom(0);\n            bot.subtract(0);\n            bot.subtract(0);\n            bot.send();\n        }`),

    13:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.copyTo(1);\n\n            bot.copyFrom(0);\n            bot.subtract(1);\n            boolean firstIsSmaller = bot.isNegative();\n\n            if (firstIsSmaller) {\n                bot.copyFrom(0);\n                bot.send();\n                bot.copyFrom(1);\n                bot.send();\n            } else {\n                bot.copyFrom(1);\n                bot.send();\n                bot.copyFrom(0);\n                bot.send();\n            }\n        }`),

    14:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.copyTo(1);\n\n            bot.copyFrom(0);\n            bot.subtract(1);\n\n            if (bot.isZero()) {\n                bot.copyFrom(0);\n                bot.send();\n            }\n        }`),

    15:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.copyTo(1);\n\n            bot.copyFrom(0);\n            bot.subtract(1);\n\n            if (bot.isNegative()) {\n                bot.copyTo(2);\n                bot.subtract(2);\n                bot.subtract(2);\n            }\n\n            bot.send();\n        }`),

    16:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n\n            bot.take();\n            bot.copyTo(1);\n\n            bot.take();\n            bot.add(0);\n            bot.add(1);\n            bot.send();\n        }`),

    17:solution(`        while (bot.hasNext()) {\n            for (int slot = 0; slot < 4; slot++) {\n                bot.take();\n                bot.place(slot);\n            }\n\n            for (int slot = 3; slot >= 0; slot--) {\n                bot.pick(slot);\n                bot.send();\n            }\n        }`),

    18:solution(`        while (bot.hasNext()) {\n            for (int slot = 0; slot < 5; slot++) {\n                bot.take();\n                bot.place(slot);\n            }\n\n            int[] order = {2, 3, 4, 0, 1};\n            for (int slot : order) {\n                bot.pick(slot);\n                bot.send();\n            }\n        }`),

    19:solution(`        bot.take();\n        bot.place(0);\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.subtract(0);\n            bot.send();\n        }`),

    20:solution(`        bot.take();\n        bot.place(0); // low\n        bot.take();\n        bot.place(1); // high\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(2);\n\n            bot.subtract(0);\n            if (bot.isNegative()) {\n                continue;\n            }\n\n            bot.copyFrom(1);\n            bot.subtract(2);\n            if (bot.isNegative()) {\n                continue;\n            }\n\n            bot.copyFrom(2);\n            bot.send();\n        }`),

    21:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n            bot.take();\n            bot.place(1);\n            bot.take();\n            bot.place(2);\n\n            compareSwap(bot, 0, 1, 3);\n            compareSwap(bot, 1, 2, 3);\n            compareSwap(bot, 0, 1, 3);\n\n            bot.copyFrom(1);\n            bot.send();\n        }`,`    private void compareSwap(ByteBot bot, int a, int b, int temp) {\n        bot.copyFrom(a);\n        bot.subtract(b);\n\n        if (!bot.isNegative() && !bot.isZero()) {\n            bot.copyFrom(a);\n            bot.place(temp);\n            bot.copyFrom(b);\n            bot.copyTo(a);\n            bot.pick(temp);\n            bot.copyTo(b);\n        }\n    }`),

    22:solution(`        bot.take();\n        bot.copyTo(0);\n        bot.send();\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n            bot.subtract(0);\n\n            if (!bot.isNegative() && !bot.isZero()) {\n                bot.copyFrom(1);\n                bot.copyTo(0);\n                bot.send();\n            }\n        }`),

    23:solution(`        bot.take();\n        bot.place(0);\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n            bot.subtract(0);\n            bot.send();\n\n            bot.copyFrom(1);\n            bot.copyTo(0);\n        }`),

    24:solution(`        bot.take();\n        bot.copyTo(0);\n        bot.send();\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n            bot.subtract(0);\n\n            if (!bot.isZero()) {\n                bot.copyFrom(1);\n                bot.send();\n            }\n\n            bot.copyFrom(1);\n            bot.copyTo(0);\n        }`),

    25:solution(`        bot.take();\n        bot.place(0);\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n            bot.subtract(0);\n\n            if (!bot.isNegative() && !bot.isZero()) {\n                bot.copyFrom(1);\n                bot.send();\n            }\n\n            bot.copyFrom(1);\n            bot.copyTo(0);\n        }`),

    26:solution(`        bot.take();\n        bot.place(0);\n        bot.take();\n        bot.place(1);\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(2);\n\n            bot.copyFrom(1);\n            bot.subtract(0);\n            boolean higherThanLeft = !bot.isNegative() && !bot.isZero();\n\n            bot.copyFrom(1);\n            bot.subtract(2);\n            boolean higherThanRight = !bot.isNegative() && !bot.isZero();\n\n            if (higherThanLeft && higherThanRight) {\n                bot.copyFrom(1);\n                bot.send();\n            }\n\n            bot.copyFrom(1);\n            bot.copyTo(0);\n            bot.copyFrom(2);\n            bot.copyTo(1);\n        }`),

    27:solution(`        bot.take();\n        boolean previousWasNegative = bot.isNegative();\n\n        while (bot.hasNext()) {\n            bot.take();\n            boolean currentIsNegative = bot.isNegative();\n\n            if (currentIsNegative != previousWasNegative) {\n                bot.send();\n            }\n\n            previousWasNegative = currentIsNegative;\n        }`),

    28:solution(`        bot.take();\n        bot.place(0); // +1\n        bot.take();\n        bot.place(1); // -1\n        bot.take();\n        bot.place(2); // 0\n\n        while (bot.hasNext()) {\n            bot.take();\n\n            if (bot.isZero()) {\n                bot.copyFrom(2);\n            } else if (bot.isNegative()) {\n                bot.copyFrom(1);\n            } else {\n                bot.copyFrom(0);\n            }\n\n            bot.send();\n        }`),

    29:solution(`        bot.take();\n        bot.place(0); // low\n        bot.take();\n        bot.place(1); // high\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(2);\n\n            bot.subtract(0);\n            if (bot.isNegative()) {\n                bot.copyFrom(0);\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(1);\n            bot.subtract(2);\n            if (bot.isNegative()) {\n                bot.copyFrom(1);\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(2);\n            bot.send();\n        }`),

    30:solution(`        bot.take();\n        bot.place(0); // anchor A\n        bot.take();\n        bot.place(1); // anchor B\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(2);\n\n            distanceFrom(bot, 2, 0, 3, 5);\n            distanceFrom(bot, 2, 1, 4, 5);\n\n            bot.copyFrom(3);\n            bot.subtract(4);\n\n            if (bot.isNegative() || bot.isZero()) {\n                bot.copyFrom(0);\n            } else {\n                bot.copyFrom(1);\n            }\n            bot.send();\n        }`,`    private void distanceFrom(ByteBot bot, int value, int anchor, int result, int temp) {\n        bot.copyFrom(value);\n        bot.subtract(anchor);\n\n        if (bot.isNegative()) {\n            bot.copyTo(temp);\n            bot.subtract(temp);\n            bot.subtract(temp);\n        }\n\n        bot.copyTo(result);\n    }`),

    31:solution(`        bot.take();\n        bot.place(0); // constant 2\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n\n            while (!bot.isZero() && !bot.isNegative()) {\n                bot.subtract(0);\n            }\n\n            if (bot.isZero()) {\n                bot.copyFrom(1);\n                bot.send();\n            }\n        }`),

    32:solution(`        bot.take();\n        bot.place(0); // constant 3\n\n        while (bot.hasNext()) {\n            bot.take();\n\n            while (!bot.isZero() && !bot.isNegative()) {\n                bot.subtract(0);\n            }\n\n            if (bot.isNegative()) {\n                bot.add(0);\n            }\n\n            bot.send();\n        }`),

    33:solution(`        bot.take();\n        bot.place(0); // 2\n        bot.take();\n        bot.place(1); // 1\n        bot.take();\n        bot.place(2); // 0\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(4);\n            bot.copyFrom(2);\n            bot.copyTo(3);\n\n            while (true) {\n                bot.copyFrom(4);\n                bot.subtract(0);\n\n                if (bot.isNegative()) {\n                    break;\n                }\n\n                bot.copyTo(4);\n                bot.copyFrom(3);\n                bot.add(1);\n                bot.copyTo(3);\n            }\n\n            bot.copyFrom(3);\n            bot.send();\n        }`),

    34:solution(`        bot.take();\n        bot.place(0); // constant 1\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(1);\n\n            while (true) {\n                bot.copyFrom(1);\n                boolean finished = bot.isZero();\n                bot.send();\n\n                if (finished) {\n                    break;\n                }\n\n                bot.copyFrom(1);\n                bot.subtract(0);\n                bot.copyTo(1);\n            }\n        }`),

    35:solution(`        bot.take();\n        bot.place(0); // constant 1\n        bot.take();\n        bot.place(1); // stamp value\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(2);\n\n            while (true) {\n                bot.copyFrom(2);\n                if (bot.isZero()) {\n                    break;\n                }\n\n                bot.copyFrom(1);\n                bot.send();\n\n                bot.copyFrom(2);\n                bot.subtract(0);\n                bot.copyTo(2);\n            }\n        }`),

    36:solution(`        bot.take();\n        bot.place(0); // constant 1\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.place(1); // a\n            bot.take();\n            bot.place(2); // b\n\n            bot.copyFrom(1);\n            bot.subtract(1);\n            bot.copyTo(3); // result = 0\n\n            while (true) {\n                bot.copyFrom(2);\n                if (bot.isZero()) {\n                    break;\n                }\n\n                bot.copyFrom(3);\n                bot.add(1);\n                bot.copyTo(3);\n\n                bot.copyFrom(2);\n                bot.subtract(0);\n                bot.copyTo(2);\n            }\n\n            bot.copyFrom(3);\n            bot.send();\n        }`),

    37:solution(`        bot.take();\n        bot.place(0); // constant 1\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.place(1); // current\n            bot.take();\n            bot.place(2); // end\n\n            while (true) {\n                bot.copyFrom(1);\n                bot.subtract(2);\n                boolean atEnd = bot.isZero();\n\n                bot.copyFrom(1);\n                bot.send();\n\n                if (atEnd) {\n                    break;\n                }\n\n                bot.copyFrom(1);\n                bot.add(0);\n                bot.copyTo(1);\n            }\n        }`),

    38:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n            bot.take();\n            bot.place(1);\n\n            while (true) {\n                bot.copyFrom(0);\n                bot.subtract(1);\n\n                if (bot.isZero()) {\n                    bot.copyFrom(0);\n                    bot.send();\n                    break;\n                }\n\n                if (bot.isNegative()) {\n                    bot.copyFrom(1);\n                    bot.subtract(0);\n                    bot.copyTo(1);\n                } else {\n                    bot.copyTo(0);\n                }\n            }\n        }`),

    39:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n            bot.take();\n            bot.place(1);\n            bot.take();\n            bot.place(2);\n\n            compareSwap(bot, 0, 1, 3);\n            compareSwap(bot, 1, 2, 3);\n            compareSwap(bot, 0, 1, 3);\n\n            for (int slot = 0; slot < 3; slot++) {\n                bot.copyFrom(slot);\n                bot.send();\n            }\n        }`,`    private void compareSwap(ByteBot bot, int a, int b, int temp) {\n        bot.copyFrom(a);\n        bot.subtract(b);\n\n        if (!bot.isNegative() && !bot.isZero()) {\n            bot.copyFrom(a);\n            bot.place(temp);\n            bot.copyFrom(b);\n            bot.copyTo(a);\n            bot.pick(temp);\n            bot.copyTo(b);\n        }\n    }`),

    40:solution(`        while (bot.hasNext()) {\n            for (int slot = 0; slot < 6; slot++) {\n                bot.take();\n                bot.place(slot);\n            }\n\n            int[] order = {0, 3, 1, 4, 2, 5};\n            for (int slot : order) {\n                bot.pick(slot);\n                bot.send();\n            }\n        }`),

    41:solution(`        bot.take();\n        bot.place(0); // 2\n        bot.take();\n        bot.place(1); // 1\n        bot.take();\n        bot.place(2); // 0\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(5);\n            bot.take();\n            bot.add(5);\n            bot.copyTo(4);\n\n            bot.copyFrom(2);\n            bot.copyTo(3);\n\n            while (true) {\n                bot.copyFrom(4);\n                bot.subtract(0);\n                if (bot.isNegative()) {\n                    break;\n                }\n\n                bot.copyTo(4);\n                bot.copyFrom(3);\n                bot.add(1);\n                bot.copyTo(3);\n            }\n\n            bot.copyFrom(3);\n            bot.send();\n        }`),

    42:solution(`        bot.take();\n        bot.place(0); // threshold\n        bot.take();\n        bot.place(1); // -1\n        bot.take();\n        bot.place(2); // 0\n        bot.take();\n        bot.place(3); // 1\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.subtract(0);\n\n            if (bot.isNegative()) {\n                bot.copyFrom(1);\n            } else if (bot.isZero()) {\n                bot.copyFrom(2);\n            } else {\n                bot.copyFrom(3);\n            }\n\n            bot.send();\n        }`),

    43:solution(`        bot.take();\n        bot.place(0); // +L\n\n        bot.copyFrom(0);\n        bot.subtract(0);\n        bot.subtract(0);\n        bot.place(1); // -L\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.place(2);\n            bot.take();\n            bot.place(3);\n\n            bot.copyFrom(2);\n            bot.subtract(3);\n            bot.copyTo(4); // d = a - b\n\n            bot.subtract(0);\n            if (!bot.isNegative() && !bot.isZero()) {\n                bot.copyFrom(0);\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(4);\n            bot.subtract(1);\n            if (bot.isNegative()) {\n                bot.copyFrom(1);\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(4);\n            bot.send();\n        }`),

    44:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(0);\n            bot.send();\n\n            bot.take();\n            bot.copyTo(1);\n            bot.subtract(0);\n\n            if (!bot.isZero()) {\n                bot.copyFrom(1);\n                bot.send();\n            }\n        }`),

    45:solution(`        while (bot.hasNext()) {\n            for (int slot = 0; slot < 5; slot++) {\n                bot.take();\n                bot.place(slot);\n            }\n\n            bot.copyFrom(0);\n            bot.subtract(4);\n            boolean outerPairMatches = bot.isZero();\n\n            bot.copyFrom(1);\n            bot.subtract(3);\n            boolean innerPairMatches = bot.isZero();\n\n            if (outerPairMatches && innerPairMatches) {\n                bot.copyFrom(2);\n                bot.send();\n            }\n        }`),

    46:solution(`        while (bot.hasNext()) {\n            bot.take();\n            bot.place(0);\n            bot.take();\n            bot.place(1);\n            bot.take();\n            bot.place(2);\n\n            bot.copyFrom(0);\n            bot.subtract(1);\n            boolean firstMatchesSecond = bot.isZero();\n\n            bot.copyFrom(0);\n            bot.subtract(2);\n            boolean firstMatchesThird = bot.isZero();\n\n            if (firstMatchesSecond || firstMatchesThird) {\n                bot.copyFrom(0);\n            } else {\n                bot.copyFrom(1);\n            }\n\n            bot.send();\n        }`),

    47:solution(`        bot.take();\n        bot.place(0); // threshold\n        bot.take();\n        bot.place(1); // reset value 0\n\n        bot.copyFrom(1);\n        bot.copyTo(2); // running sum\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.add(2);\n            bot.copyTo(2);\n            bot.subtract(0);\n\n            if (!bot.isNegative()) {\n                bot.copyFrom(2);\n                bot.send();\n\n                bot.copyFrom(1);\n                bot.copyTo(2);\n            }\n        }`),

    48:solution(`        bot.take();\n        bot.place(0); // low\n        bot.take();\n        bot.place(1); // high\n        bot.take();\n        bot.place(2); // bonus\n\n        while (bot.hasNext()) {\n            bot.take();\n            bot.copyTo(3);\n            bot.subtract(0);\n\n            if (bot.isNegative()) {\n                bot.copyFrom(0);\n                bot.subtract(3);\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(3);\n            bot.subtract(1);\n            if (!bot.isNegative() && !bot.isZero()) {\n                bot.send();\n                continue;\n            }\n\n            bot.copyFrom(3);\n            bot.add(2);\n            bot.send();\n        }`)
  };

  window.BYTE_JAVA_SOLUTIONS=S;
})();
