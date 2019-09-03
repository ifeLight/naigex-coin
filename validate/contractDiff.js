var fs = require('fs');
const chalk = require("chalk");
const diff = require("diff");

function readFileSync(filename) {
    return fs.readFileSync(filename, "utf8");
}

function writeFileSync(filename, text) {
    fs.writeFileSync(filename, text);
}

function getFilenamesFromCode(code) {
    // find all lines with prefix "// File:"
    var filenames = code.match(/\/\/\s*File:\s*\S+\n/gi);
    for (var i = 0; i < filenames.length; i++) {
        // remove prefix "// File: ".
        filenames[i] = filenames[i].replace(/\/\/\s*File:\s*/i, "");
        filenames[i] = filenames[i].replace(/\s+/i, "");

        // directory openzeppelin-solidity is inside node_modules
        if(filenames[i].match(/openzeppelin-solidity/)){
            filenames[i] = "node_modules/" + filenames[i]
        }

        // directory zos-lib is inside node_modules
        if(filenames[i].match(/zos-lib/)){
            filenames[i] = "node_modules/" + filenames[i]
        }

        // add ./ prefix
        filenames[i] = "./" + filenames[i];
        console.log(filenames[i]);
    }
    return filenames;
}

function createCodeFile(filenames) {
    var code = "";
    for (var i = 0; i < filenames.length; i++) {
        try {
            console.log("Reading file " + filenames[i]);
        } catch (err) {
            console.log("Could not read file " + filenames[i]);
            return "";
        }
        code = code + readFileSync(filenames[i]) + "\n";
    }
    return code;
}

function diffText(code1, code2) {
    const diffOutput = diff.diffTrimmedLines(code1, code2);
    for (var i = 0; i < diffOutput.length; i++) {
        var diffLine = diffOutput[i];
		if (diffLine.added) {
	  	    process.stdout.write(chalk.green(`+ ${diffLine.value}`));
	    } else if (diffLine.removed) {
			process.stdout.write(chalk.red(`- ${diffLine.value}`));
	    }
	}
}

function removeExtraComments(code) {
    var modified = code.replace(/\/\/\s*File:\s*\S+\n/ig, "");
    return modified;
}

function validate(filename) {
    var code = readFileSync(filename);

    var filenames = getFilenamesFromCode(code);
    var expectedCode = createCodeFile(filenames);

    code = removeExtraComments(code);
    diffText(code, expectedCode);
}

function printUsage() {
    console.log("node contractDiff <file1> <file2> .... <fileN>");
}

function main() {
    if(process.argv.length < 3) {
        printUsage();
        return;
    }

    var fail = 0;
    var total = process.argv.length -2;
    var goodFiles = "";
    var badFiles = "";

    for(var i=2; i<process.argv.length; i++) {
        var filename = process.argv[i]
        console.log("Checking: " + filename);
        try {
            validate(filename);
            goodFiles = goodFiles + filename + "\n";
        } catch (err) {
            console.log("Error validating file " + filename);
            console.log(err.msg);
            badFiles = badFiles + filename + "\n";
            ++fail;
        }
    }

    if(total - fail > 0) {
 	    process.stdout.write(chalk.green("\n\nSuccessfully processed " + (total-fail) + " files.\n"));
  	    process.stdout.write(chalk.green(goodFiles));
    }

    if(fail > 0) {
        process.stdout.write(chalk.red("\n\nFailed to process " + fail + " files.\n"));
        process.stdout.write(chalk.red(badFiles + "\n"));
    }
}

main();

