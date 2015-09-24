var express = require('express');
var router = express.Router();
var util = require("util");
var my = require("../lib/minify");
var exec = require('child_process').exec;

/* GET home page. */
router.get('/', function(req, res, next) {
    
	res.render("upload.html", {
		title: 'Upload images'
	});
});

/* Post Upload File listing. */
router.post('/upload', function(req, res, next) {
    
    var mimetype = req.files.displayImage.mimetype;
    var imageName = req.files.displayImage.name;
    var imageSize = req.files.displayImage.size;

    try {
        //check the post file type (jpeg,gif,webp,png).
        if (mimetype === 'image/png' || mimetype === 'image/jpeg' || mimetype === 'image/gif' || mimetype === 'image/webp') {
            fs.readFile(req.files.displayImage.path, function(err, data) {
                if (!req.files.displayImage.name) {
                    console.log(colors.magenta("The image file transfer has an error."));
                    res.jsonp({
                        error: 'The image file transfer has an error.'
                    });
                } else {

                    var fullPath = process.cwd() + "/uploads/fullsize/" + imageName;
                    var minifyPath = process.cwd() + "/uploads/minify/" + imageName;
                    /// write file to uploads/fullsize folder
                    fs.writeFile(fullPath, data, function(err) {
                        if (err) {
                            console.log(colors.magenta("Write fullsize image found an error."));
                            res.jsonp({
                                error: 'Write fullsize image found an error.'
                            });
                        } else {
                            console.log(colors.grey('Write fullsize image success.'));
                            if (mimetype === 'image/png' || mimetype === 'image/jpeg') {
                                //when image size more than 1M,Compress it. or copy it to minify.
                                if (imageSize > 1048576) {
                                    //If the image type is png or jpeg, minify it.
                                    process.nextTick(function() {
                                        my.minify(process.cwd() + "/uploads/fullsize/", imageName, process.cwd() + "/uploads/minify", imageName, function(compress) {
                                            res.jsonp({
                                                error: 'Image Uploaded.',
                                                imgid: imageName,
                                                compress: compress,
                                                minify_url: url + '/uploads/minify/' + imageName
                                            });
                                        });
                                    });
                                } else {
                                    //less than 1M copy it to minify directory.
                                    fs.writeFile(minifyPath, data, function(err) {
                                        if (err) {
                                            console.log(colors.magenta("Copy minify image found an error."));
                                            res.jsonp({
                                                error: 'Copy minify image found an error.'
                                            });
                                        } else {

                                            console.log(colors.grey('Copy minify image success.'));
                                            var compress = {
                                                error: 'ok',
                                                before: (imageSize / 1048576).toFixed(2) + "M",
                                                after: (imageSize / 1048576).toFixed(2) + "M",
                                                rate: '0%',
                                                time: '0mm0ss'
                                            };
                                            res.jsonp({
                                                error: "Image Uploaded, But it's size less than 1M and no compression.",
                                                imgid: imageName,
                                                compress: compress,
                                                minify_url: url + '/uploads/minify/' + imageName
                                            });
                                        }
                                    });
                                }

                            }
                            //file mismatch return fullsize url
                            else {
                                console.log("Image Uploaded, But No Compression.The image type can't be compressed.");
                                var compress = {
                                    error: 'ok',
                                    before: (imageSize / 1048576).toFixed(2) + "M",
                                    after: (imageSize / 1048576).toFixed(2) + "M",
                                    rate: '0%',
                                    time: '0mm0ss'
                                };
                                res.jsonp({
                                    error: "Image Uploaded, But the image type can't be compressed.",
                                    imgid: imageName,
                                    compress: compress,
                                    minify_url: url + '/uploads/fullsize/' + imageName
                                });
                            }
                        }
                    });
                }
            });
        } else {
            res.jsonp({
                error: 'Image type mismatch.'
            });
        }
    } catch (e) {
        next(e);
    }
});

/* Thumb Image */
router.get('/thumb/:id', function(req, res, next) {
	try {
		var file = req.params.id;
		if (file.match(/[^\/]+(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/) != null && typeof file.match(/[^\/]+(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/) != 'undefined') {
			var type = file.match(/(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/g).toString().replace(/\./gi, '').toLowerCase();
            // console.log(colors.yellow(type));
			//check whether the width and the height is be posted.
			if (file.match(/[\d]+×[\d]+/g) != null && typeof file.match(/[\d]+×[\d]+/g) != 'undefined') {
				var lwth = file.match(/[\d]+×[\d]+/g)[0].split('×');
				var width = lwth[0];
				var height = lwth[1];
				var file_nm;
                // console.log(colors.red(width+' '+height));
				//get the original image name.
				if (file.match(/[a-zA-Z0-9]+\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP)/) != null && typeof file.match(/[a-zA-Z0-9]+\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP)/) != 'undefined') {
					file_nm = file.match(/[^_][a-zA-Z0-9]+\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP)/)[0].toString().toLowerCase();
                    // console.log(colors.black(file.match(/[a-zA-Z0-9]+\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP)/)[0]));
                    // console.log(colors.blue(file_nm));
					//check original image type.
					if (file_nm.match(/(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/) != null && file_nm.match(/(.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/) != 'undefined') {
						var type_origin = file_nm.match(/(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/g).toString().replace(/\./gi, '').toLowerCase();
                        // console.log(colors.red(type_origin));
						if (type_origin === 'jpg' || type_origin === 'jpeg' || type_origin === 'png') {
							//First check thumb image exists，if exist return it,otherwise gm it and return it.
							fs.lstat(process.cwd() + "/uploads/thumb/" + file, function(err, stats) {
								if (err) {
									fs.lstat(process.cwd() + "/uploads/minify/" + file_nm, function(err, stats) {
										if (err) {
											res.jsonp({error: 'Please minify the image firstly.', thumb_url: url + '/uploads/fullsize/' + file_nm});
										} else {
											//resize the image with the width and the height.
											gm(process.cwd() + "/uploads/minify/" + file_nm)
												.gravity('Center')
												.resize(width, height, '^')
												.quality(100)
												.autoOrient()
												.write(process.cwd() + "/uploads/thumb/" + file, function(err) {
													if (err) {
														next(err);
													} else res.jsonp({error: "ok.", thumb_url: url + '/uploads/thumb/' + file});
												});
										}
									});
								} else res.jsonp({error: 'ok.', thumb_url: url + '/uploads/thumb/' + file});
							});
						} else res.jsonp({error: "The original file can't be thumb because of the type.", thumb_url: url + '/uploads/fullsize/' + file_nm});
					} else res.jsonp({error: 'The original image type not match the require.'});
				} else res.jsonp({error: 'The thumbnail namme not match the require.'});
			} else res.jsonp({error: 'Please assign the width and height.'});
		} else next();
	} catch (e) {
		next(e);
	}
});

/* get File listing. */
router.get(['/uploads/shot/:image','/uploads/minify/:image', '/uploads/split/:image', '/uploads/fullsize/:image', '/uploads/thumb/:image'], function(req, res, next) {
    try {
        var file = req.params.image;
        //check param image.
        if (file.match(/[^\/]+(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/g) != null && typeof file.match(/[^\/]+(\.(jpg|jpeg|JPG|JPEG|png|PNG|gif|GIF|webp|WEBP))$/g) != 'undefined') {
            //grab the request path.
            if (req.path.match(/\/shot|fullsize|crop|minify|thumb\//) != null && typeof req.path.match(/\/shot|fullsize|crop|minify|thumb\//) != 'undefined') {
                var reqpath = req.path.match(/\/shot|fullsize|crop|minify|thumb\//).toString().replace(/\//, '');
                var localpath = process.cwd() + '/uploads/' + reqpath + '/' + file;
                //check the loacl file exist.
                fs.lstat(localpath, function(err, stats) {
                    //if not exist,404.
                    if (err) {
                        next();
                    } else {
                        res.sendFile(localpath);
                    }
                });
            } else next();
        } else next();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
