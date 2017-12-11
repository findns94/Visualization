# Visualization

`src/data/main.dot` 是编辑之后的dot文件，里面只包含了RangeState。

`src/data/main.png`是dot编译后的图片，但是是水平放置的，很难看，不知道graphviz有没有办法将它垂直放置起来。

`src/data/easy_integer_range2.c`和`easy_integer_range2.ll`是对应的c语言文件和编译后的llvm文件，使用如下命令行编译（需安装llvm）

```shell
clang -S -emit-llvm easy_integer_range2.c
```

注：不同版本的llvm编译结果可能不同

