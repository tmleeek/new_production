
	var $j = jQuery.noConflict(); 
	
	$j(document).ready(function() {
	
		// Get the document height for each page
		document_height = $j(document).height();

		// *************** CUSTOM OPTIONS ***************
	
		// When the product view loads, only the first tab is displayed, all the others are not.
		$j(".product-options dd:not(.material)").hide();

		// Hide the corresponding labels
		$j(".custom_option_label").hide();
		$j("#custom_option_material").prev(".custom_option_label").show();

		// Only the active tab has a black background, all the others are grey.
		$j(".product-options dt:not(.material) label.required").css("background-color", "#b19d68");

		// Tracks if the canvas option has been selected or not
		var canvas_active = 0;
		var paper_active = 0;

		// Selected frame url and mats color
		var frame_image_url = "-1";
		var frame_image_source = "-1";
		var mats_color_code = "";
		var mats_size = 0;
		selected_mats_size = 2;
		var dpi = 3;
		var frame_scale_factor = 1;
		var viewport_scale_factor = 0.15;

		var size_name = "";
		var setup = 1;
		
		var frame_width = 60;
		var frame_height = 60;

		var framing_enabled = 0;
		var matting_enabled = 0;

		var background_container_width = 450;
		var background_container_height = 450;
		
		var background_room_size_inches = 120;
		var size_scale_factor = background_container_width / background_room_size_inches;
		var selected_width = 0;
		var selected_length = 0;

		// Maximum height of the furniture in the room, in pixels
		var furniture_top = 315;
		// Minimum gap between the top of the furniture and the bottom of the image, converting the inches in pixels directly
		var furniture_top_image_bottom_gap = 12 * size_scale_factor;
		// Subtract the real image height from this number and get the correct dynamic image top coordinate
		var furniture_image_gap = furniture_top - furniture_top_image_bottom_gap;

		var rooms_view_enabled = 0;

		//var browser = BrowserDetect.browser;

		// Product configuration variables
		var selected_substrate = "";
		var selected_size = "";
		var poster_size = "";
		var selected_borders = "";
		var selected_wrap = "";
		var selected_frame = "";
		var selected_mats = "";
		// End of product configuration variables

		var active_option = "";
		oversize_flag = false;
		oversize_list = new Array();
		mats_sizes_list = new Object;
		mats_skus_list = new Object;
		shown_mats_skus = new Object;

		s3_framing_profiles_base_url = "https://s3.amazonaws.com/topart_images/icons/framing_profiles/";

		image_short_side = 0, image_long_side = 0;
		selected_frame_maximum_long_side = 0, selected_frame_maximum_short_side = 0;

		selected_size_background_color = "#b19d68";
		selected_size_text_color = "#ffffff";

		last_selected_frame_sku = "";
		last_selected_mat_sku = "";
		last_selected_frame_category = "Blacks";

		number_of_shown_mats = 0;
		var custom_url = "";

		$j("ul#custom_option_mat li").siblings().each(

			function() 
			{
				mats_sku = $j(this).data("mats_sku");
				mat_category = $j(this).data("mat_category");
				mats_size = $j(this).data("mats_size");
				mats_color = $j(this).css("background-color");

				if (mat_category == "MatsColorOS" || mat_category == "MatsWhiteOS" || mat_category == "MatsNeutralOS" || mat_category == "MatsBlackOS")
				{
					oversize_list.push(mats_sku);
				}

				mats_sizes_list[mats_sku] = mats_size;
				mats_skus_list[mats_color] = mats_sku;

				// By the time this loop ends, we know what sku corresponds to what color, for every mat option
			}
		);



		// Parametrically show specific custom options images
		function show_options_images(option_name)
		{
			// Hide every image first
			$j("#custom_options_images ul").hide();

			// Show the option node
			$j("#custom_options_images #custom_option_" + option_name ).show();
			// Show every descendant node for that option
			$j("#custom_options_images #custom_option_" + option_name  + "*" ).show();

			// Show the option label
			$j("#custom_options_images #custom_option_" + option_name).prev(".custom_option_label").show();

			if (option_name == "material")
			{
				// Show the option node
				$j("#custom_options_images #custom_option_" + "size" ).show();
				// Show every descendant node for that option
				$j("#custom_options_images #custom_option_" + "size"  + "*" ).show();

				// Show the option label
				$j("#custom_options_images #custom_option_" + "size").prev(".custom_option_label").show();

				$j("#size_info").show();
			}

			else
			{
				$j("#size_info").hide();
			}
		}

		// Parametrically hide specific custom options images
		function hide_options_images(option_name)
		{
			// Hide the option node
			$j("#custom_options_images #custom_option_" + option_name ).hide();
			// Hide every descendant node for that option
			$j("#custom_options_images #custom_option_material" + option_name  + "*" ).hide();
		}

		// Parametrically activate a tab
		function activate_option_tab(option_name)
		{
			// Activate the input buttons
			$j(".product-options dt." + option_name ).show();
		}

		// Parametrically deactivate a tab
		function deactivate_option_tab(option_name)
		{
			// Activate the input buttons
			$j(".product-options dt." + option_name ).hide();
		}

		// Parametrically enable an option
		function enable_option(option_name)
		{
			// Activate the corresponding tab
			activate_option_tab(option_name);
			$j(".product-options dd." + option_name ).show();

			active_option = option_name;

			// Show the corresponding images
			show_options_images(option_name);
		}

		// Parametrically disable an option
		function disable_option(option_name)
		{
			// Deactivate the corresponding tab
			deactivate_option_tab(option_name);
			$j(".product-options dd." + option_name ).hide();

			// Hide the corresponding images
			hide_options_images(option_name);
		}

		// Show specific material related sizes
		function show_poster_paper()
		{
			// Load paper-related sizes only
			// Handle input types
			$j("dd.size li").hide();
			$j("dd.size li[class*='size_posterpaper']").show();

			// Handle options images
			$j("#custom_options_images #custom_option_size li").hide();
			$j("#custom_options_images #custom_option_size li[id*='size_posterpaper']").show();
		}

		// Show specific material related sizes
		function show_photo_paper()
		{
			// Load paper-related sizes only
			// Handle input types
			$j("dd.size li").hide();
			$j("dd.size li[class*='size_photopaper']").show();

			// Handle options images
			$j("#custom_options_images #custom_option_size li").hide();
			$j("#custom_options_images #custom_option_size li[id*='size_photopaper']").show();
		}

		// Show specific material related sizes
		function show_canvas(treatment_index)
		{
			// Show the canvas-related sizes only if the borders treatment index is not 0, i.e. not "treatments_none"
			if (treatment_index != 0)
			{
				// Load paper-related sizes only
				// Handle input types
				$j("dd.size li").hide();
				$j("dd.size li[class*='treatment_" + treatment_index + "']").show();

				// Handle options images
				$j("#custom_options_images #custom_option_size li").hide();
				$j("#custom_options_images #custom_option_size li[id*='treatment_"+ treatment_index +"']").show();
			}
		}

		function elements_exists(element)
		{
			return $j(element).length != 0;
		}

		function size_exists(size_name)
		{
			return $j("ul#custom_option_size li[id*='" + size_name + "']:eq(0)").length != 0;
		}

		function click_option(option_name, index, material_name)
		{
			if ( option_name == "material" )
			{
				$j("dd." + option_name + " li[class*='" + material_name + "']:eq(0) input").attr('checked','checked');
				$j("dd." + option_name + " li[class*='" + material_name + "']:eq(0) input").trigger('click');
			}

			else if ( option_name == "size" )
			{
				if ( material_name == "canvas" )
				{
					$j("dd.size li[class*='" + size_name + "_treatment_" + index + "']:eq(0) input").attr('checked','checked');
					$j("dd.size li[class*='" + size_name + "_treatment_" + index + "']:eq(0) input").trigger('click');

					selected_canvas_size = $j("ul#custom_option_size li[id*='" + size_name + "_treatment_" + index + "']:eq(0)");

					if (elements_exists(selected_canvas_size))
						selected_canvas_size.css("background-color", selected_size_background_color);
					//else
						//$j("ul#custom_option_size li[id*='canvas']:eq(0)").css("background-color", selected_size_background_color);
				}

				else
				{
					$j("dd.size li[class*='" + material_name + "']:eq(0) input").attr('checked','checked');
					$j("dd.size li[class*='" + material_name + "']:eq(0) input").trigger('click');

					$j("ul#custom_option_size li[id*='" + material_name + "']:eq(0)").css("background-color", selected_size_background_color);
				}
			}

			else if (option_name == "mat")
			{
				$j("dd.mat li:last input").attr('checked', 'checked');
				$j("dd.mat li:last input").trigger('click');	
			}

			else
			{
				$j("dd." + option_name + " li:nth-of-type(" + index + ") input").attr('checked','checked');
				$j("dd." + option_name + " li:nth-of-type(" + index + ") input").trigger('click');
			}

			// Update the current option information
			$j(".current_" + option_name).html($j(this).parent().attr('class'));
		}

		function set_size(size_sku)
		{
			$j("dd.size li[class='" + size_sku + "'] input").attr('checked','checked');
			$j("dd.size li[class='" + size_sku + "'] input").trigger('click');
			$j("ul#custom_option_size li[id*='" + size_sku + "']:eq(0)").css("background-color", selected_size_background_color);
		}

		function reset_matting()
		{
			$j("dd.mat li.mats_none input").trigger("click");
			opConfig.reloadPrice();
			$j("#customize_substrate_link").trigger("click");
		}

		function reset_framing_matting()
		{
			$j("ul#custom_option_frame li#frame_none").trigger("click");
			reset_matting();
		}		

		function is_frame_available(frame_sku)
		{
			frame_sku_selector = "ul#custom_option_frame li[id='" + frame_sku + "']";

			frame_maximum_long_side = $j(frame_sku_selector).data("frame_maximum_long_side");
			frame_maximum_short_side = $j(frame_sku_selector).data("frame_maximum_short_side");
			
			frame_available_4_paper = $j(frame_sku_selector).data("frame_available_4_paper");
			frame_available_4_canvas = $j(frame_sku_selector).data("frame_available_4_canvas");

			if ( image_long_side <= frame_maximum_long_side && image_short_side <= frame_maximum_short_side )
			{
				return true;
			}
			else
			{
				return false;
			}
		}


		function select_framing_category(category_name)
		{
			// Display the selected category in the list as the active one
			$j("select#frame_categories option[value*='" + category_name + "']").attr("selected", "selected");
			last_selected_frame_category = category_name;

			// Show the corresponding framing images
			show_framing_images(category_name);

		}

		function show_framing_images(category_name)
		{
			// Show the corresponding framing options images, based on the UI
			if (category_name != null)
			{
				$j("ul#custom_option_frame li").hide();

				frame_options = $j("ul#custom_option_frame li:not('#frame_none')").siblings();
				$j( frame_options ).each(

					function() 
					{
						frame_sku = $j(this).attr("id");
						frame_category = $j(this).data("frame_category");

						if (frame_category == category_name && is_frame_available(frame_sku))
						{
							$j(this).show();
						}
					}
				);
			}
		}

		function check_mats_visibility()
		{
			shown_mats_skus = new Object;
			number_of_shown_mats = 0;

			var available_mats = $j("li.mats_color").siblings();
			$j( available_mats ).each(

				function() 
				{
					mats_sku = $j(this).data("mats_sku");
					mats_color = $j(this).css("background-color");

					mat_maximum_long_side = $j(this).data("mat_maximum_long_side");
					mat_maximum_short_side = $j(this).data("mat_maximum_short_side");
					this_mats_size = parseFloat($j(this).data("mats_size"));

					matted_long_side = parseFloat(image_long_side) + 2*this_mats_size;
					matted_short_side = parseFloat(image_short_side) + 2*this_mats_size;					

					// If this mats color is related to a mats sku which is not available, then hide it
					//if (!is_mat_available(mats_sku))
					if ( (image_long_side > mat_maximum_long_side || image_short_side > mat_maximum_short_side) || (matted_long_side > selected_frame_maximum_long_side || matted_short_side > selected_frame_maximum_short_side) )
					{
						$j(this).hide();
					}

					// Else, it's valid, but further checks are required to show it
					else
					{
						// If we have seen this color before, hide it
						if (shown_mats_skus[mats_color])
						{
							$j(this).hide();
						}

						// Else, add it to the list of the shown mats colors, and then show it
						else
						{
							shown_mats_skus[mats_color] = new Array();
							number_of_shown_mats++;
						}

						shown_mats_skus[mats_color].push(mats_sku);

					}
				}
			);
		}



		function show_mats_colors_grid()
		{
			$j("li.mats_color").show();
			check_mats_visibility();

			if (last_selected_mat_sku == "mats_none")
			{
				$j("li.mats_color:eq(0)").trigger("click");
			}
			
		}


		function is_mat_available(mats_sku)
		{
			mat_selector = $j("ul#custom_option_mat li[id='" + mats_sku + "']");
			mats_color = $j(mat_selector).css("background-color");

			mat_maximum_long_side = $j(mat_selector).data("mat_maximum_long_side");
			mat_maximum_short_side = $j(mat_selector).data("mat_maximum_short_side");
			this_mats_size = parseFloat($j(mat_selector).data("mats_size"));
			matted_long_side = parseFloat(image_long_side) + 2*this_mats_size;
			matted_short_side = parseFloat(image_short_side) + 2*this_mats_size;


			// Size constraints check	
			if ( (image_long_side > mat_maximum_long_side || image_short_side > mat_maximum_short_side) || (matted_long_side > selected_frame_maximum_long_side || matted_short_side > selected_frame_maximum_short_side) )
			{
				return false;	
			}
			
			// The size is valid, but let's check if this is an oversize mats also having a regular size counterpart first
			else
			{
				regular_counterpart_exists = false;

				if (shown_mats_skus[mats_color])
				{
					// Iterate over all of the skus that relate to the specific mats color
					for (i = 0; i < shown_mats_skus[mats_color].length; i++)
					{
						i_th_sku = shown_mats_skus[mats_color][i];
						// If the i-th sku is not oversize, record it for later
						if (oversize_list.indexOf(i_th_sku) < 0)
						{
							regular_counterpart_exists = true;
						}
					}	

					// If the sku is not oversize, or if it is oversize but there is no regular size counterpart, then show it
					if ( oversize_list.indexOf(mats_sku) < 0 || (oversize_list.indexOf(mats_sku) >= 0 && !regular_counterpart_exists) )
					{
						return true;
					}
					else
					{
						return false;
					}
				}
			}

		}


		// When you select a mat color, show the corresponding valid skus (compatible with the given size)
		function show_mats_options(mats_color)
		{
			// Hide every matting option first
			$j("dd.mat li").hide();
			$j("dd.mat li.mats_none").show();

			$j("dd.mat li").siblings().each(

				function() 
				{
					mats_sku = String($j(this).attr("class"));

					// If there is a sku for the selected color
					if (shown_mats_skus[mats_color] && shown_mats_skus[mats_color].indexOf(mats_sku) >= 0)
					{
						// Select the skus of the related color only
						// Now check if it is valid for the selected image size and frame size
						if (is_mat_available(mats_sku))
						{
							$j(this).show();

							visible_mat_option_class = $j(this).attr("class");
							visible_mat_size = visible_mat_option_class.charAt(visible_mat_option_class.length-1);

							// Now automatically select the mat option with the same size as the previous user mat selection
							if (visible_mat_size == selected_mats_size)
							{
								$j(this).find("input").trigger("click");
							}
						}
					}
				}
			);

		}


		old_size_ui = 1;

		// Refresh the framing, matting and stretching prices to reflect the selected size UI
		function update_ui_prices(size_ui, matted_size)
		{
			// Dynamically update the displayed prices for the framing options
			var frame_options = $j("ul#custom_option_frame li").siblings();
			var mounting_flat_price = 12.00;

			$j( frame_options ).each(

				function() 
				{
					frame_ui_node = $j(this).find(".frame_ui_price");
					frame_ui_price = frame_ui_node.html();				

					frame_real_node = $j(this).find(".frame_real_price");
					frame_real_price = ( matted_size * frame_ui_price + mounting_flat_price ).toFixed(2);
					frame_real_node.html(frame_real_price);
					
				}
			);

			// Dynamically update the displayed prices for the matting options
			var mats_options = $j("dd.mat li:not('.mats_none')").siblings();
			$j( mats_options ).each(

				function() 
				{
					// Get the specific node
					mats_real_node = $j(this);
					current_node_mats_sku = mats_real_node.attr("class");
					current_node_mats_size = parseInt(mats_sizes_list[current_node_mats_sku]);
					
					selected_mats_index = $j(this).index();
					mats_ui_node = $j("ul#custom_option_mat li:eq(" + selected_mats_index + ")");
					mats_ui_price = mats_ui_node.find(".mats_ui_price").html();

					// Compute the real price and round it to the first two decimal digits
					mats_real_price = ( (parseFloat(size_ui) + 4*parseFloat(current_node_mats_size)) * mats_ui_price ).toFixed(2);
					
					// Assign it back to the node
					mats_real_node.find("span.price").html(mats_real_price);
					
				}
			);

			
			// Dynamically update the displayed price for stretching
			canvas_stretching_node = $j("dd.canvas_stretching").find("span.price");

			// If the update is done for the first time, this is the ui price
			if ( $j(".canvas_available").html() == "1" )
			{
				if ( setup == 1)
				{
					//canvas_stretching_ui_price = canvas_stretching_node.html().substring(1);
					canvas_stretching_ui_price = 1.08;
				}
				// Else, it already represents the total prices and has to be divided by the last selected size ui
				else
				{
					canvas_stretching_ui_price = 1.08 / old_size_ui;
				}

				canvas_stretching_price = ( canvas_stretching_ui_price * matted_size ).toFixed(2);
				canvas_stretching_node.html("$" + canvas_stretching_price);
			}
			

			setup = 0;
			old_size_ui = matted_size;
		}


		// Select an available matting option, by clicking on the color
		$j(".mats_color").click(

			function()
			{
				// Currently selected available mats color
				id_name = $j(this).attr("id");

				selected_size_name = $j("dd.size li input:checked").parent().attr('class');
				mats_sku = $j(this).data("mats_sku").toLowerCase();
				mats_color_code = $j(this).css("background-color");	
				mat_category = $j(this).data("mat_category");

				oversize_flag = false;

				if (mat_category == "MatsColorOS" || mat_category == "MatsWhiteOS" || mat_category == "MatsNeutralOS" || mat_category == "MatsBlackOS")
					oversize_flag = true;

				// Apply the selected color to the background of the corresponding preview
				$j("#mats_2_inches").css("background-color", mats_color_code);
				$j("#mats_3_inches").css("background-color", mats_color_code);
				
				// Reset every mats color border to the original value
				original_border_color = "#cccccc";
				$j(".mats_color").css("border-color", original_border_color);

				// Highlight the clicked color image
				$j(this).css("border-color", "#0000ff");

				if ( matting_enabled == 1 && id_name == "mats_none" )
				{
					$j("dd.mat li.mats_none input").attr("checked", "checked");
					$j("dd.mat li.mats_none input").trigger("click");

					matting_enabled = 0;
				}

				if (matting_enabled == 0 && id_name != "mats_none" && rooms_view_enabled == 0)
				{
					matting_enabled	= 1;

					// Recompute the image geometric features
					background_width = background_container_width - 2 * frame_width - 2*mats_size*dpi;
					background_height = background_container_height  - 2 * frame_height - 2*mats_size*dpi;

					width = parseInt($j("#final_product_image").css("width").replace("px", ""));
					height = parseInt($j("#final_product_image").css("height").replace("px", ""));

					// In Percentage
					top_percentage = 50;
					left_percentage = 50;

					x = width/background_width;
					y = height/background_height;

					max_size = Math.max(x, y);

					width = width/max_size;
					height = height/max_size;

					width_percentage = (width/background_width) * 100;
					height_percentage = (height/background_height) * 100;

					width = background_width * (width_percentage/100);
					height = background_height * (height_percentage/100);

					margin_top_percentage = height_percentage/-2;
					margin_left_percentage = width_percentage/-2;
					

					// In Pixels
					top = background_height * (top_percentage/100) + frame_height;
					left = background_width * (left_percentage/100) + frame_width + mats_size*dpi;

					margin_top = background_height * (margin_top_percentage/100);
					margin_left = background_width * (margin_left_percentage/100);


					// Resize the image
					resize_image(width, height, top, left, margin_top, margin_left);
				}	

				show_mats_options(mats_color_code);
			}

		);

		$j("dd.mat li input").click(
			
			function()
			{
				// Update che current mats information
				mats_sku = $j(this).parent().attr("class");
				last_selected_mat_sku = mats_sku;
				
				$j(".current_mats").html(mats_sku);
				mats_size = mats_sizes_list[mats_sku];
				selected_mats_size = parseFloat(mats_size);

				// Update the size UI accordingly
				$j(".selected_mats_size").html(selected_mats_size);

				opConfig.reloadPrice();

				if (mats_sku == "mats_none")
				{
					// Reset the mats size
					mats_size = 0;

					// Reset every mats color border to the original value
					original_border_color = "#cccccc";
					$j(".mats_color").css("border-color", original_border_color);
				}


				if (mats_size == 2)
				{
					$j("#mats_2_inches").addClass("active_option");
					$j("#mats_2_inches .mats_l_shape").addClass("active_mats_l_shape");

					$j("#mats_3_inches").removeClass("active_option");
					$j("#mats_3_inches .mats_l_shape").removeClass("active_mats_l_shape");
				}

				else if (mats_size == 3)
				{
					$j("#mats_3_inches").addClass("active_option");
					$j("#mats_3_inches .mats_l_shape").addClass("active_mats_l_shape");

					$j("#mats_2_inches").removeClass("active_option");
					$j("#mats_2_inches .mats_l_shape").removeClass("active_mats_l_shape");
				}

				else
				{
					//
				}

				// Activate the dynamic matting effect
				if (frame_image_url != "-1" && frame_image_url.indexOf("/.png") == -1)
					activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size);
			}

		);

		var site_base_url = $j(".site_base_url").html();

		// Activate a specific option tab on click
		$j(".product-options label.required").click(
			
			function()
			{
				// Hide all the other tabs options
				var clicked_option = $j(this).parent().attr('class');
				$j(".product-options dd").not(clicked_option).hide();
				// Show the clicked tab options
				$j(".product-options dd." + clicked_option).show();

				// Make the all the other tabs grey
				$j(".product-options label.required:not(this)").css("background-color", "#b19d68");
				// Make the clicked tab black
				$j(this).css("background-color", "#000000");

				// Hide the option label
				$j("#custom_options_images .custom_option_label").hide();

				// Show the corresponding options images
				show_options_images(clicked_option);

				if ( clicked_option == "material" )
				{
					$j("#canvas_top_border").show();
					$j("#canvas_right_border").show();

					// Show the custom size button
					$j("#custom_size_link").show();
				}

				else
				{
					$j("#canvas_top_border").hide();
					$j("#canvas_right_border").hide();

					// Hide the custom size button
					$j("#custom_size_link").hide();
				}

				if ( clicked_option == "borders" && canvas_active )
				{
					//$j("dd.canvas_stretching").show();

					// Show the borders
					$j("#three_inches_white_top_border").show();
					$j("#three_inches_white_right_border").show();

					$j("#two_inches_black_one_inch_white_top_border").show();
					$j("#two_inches_black_one_inch_white_right_border").show();
				}
				else
				{
					// Show the borders
					$j("#three_inches_white_top_border").hide();
					$j("#three_inches_white_right_border").hide();

					$j("#two_inches_black_one_inch_white_top_border").hide();
					$j("#two_inches_black_one_inch_white_right_border").hide();
				}

				if ( clicked_option == "size" )
				{

					$j("dd.size .input-box ul li:visible:gt(3)").each(

						function(index) 
						{
						    // Correct options input positioning
							$j(this).css("top", "5px");
						}
					);

					$j("dd.size .input-box ul li:visible:lt(4)").each(

						function(index) 
						{
						    // Correct options input positioning
							$j(this).css("top", "-120px");
						}
					);

					// Activate the room view, selecting the couch as the background
					if ( $j("#final_product_image_background").css("background-image") == "none" || 
						$j("#final_product_image_background").css("background-image") == ("url(" + site_base_url + "/undefined)") )
					{
						$j("#room_switch .room_thumbnail:nth-child(2)").trigger("click");
					}

					// Hide the custom size image for now
					$j("ul#custom_option_size li[id*='custom_ui']").hide();
					//$j("dd.size li[class*='custom_ui']").css("top", "-100px");
					//$j("dd.size li[class*='custom_ui']").hide();
					$j("dd.size li[class*='custom_treatment']").hide();
					$j("ul#custom_option_size li[class*='custom_ui']").hide();
					$j("ul#custom_option_size li[id*='custom_treatment']").hide();

				}

				if ( clicked_option == "frame" )
				{
					$j(".category_framing").show();
					$j("select#frame_categories").show();
				}

				else
				{
					$j(".category_framing").hide();
					$j("select#frame_categories").hide();
				}

				if ( clicked_option == "mat" )
				{
					$j("#mats_previews").show();
					$j("#available_mats").show();
					$j("#mats_line").show();

					// Show the mats colors grid
					show_mats_colors_grid();					
				}

				else
				{
					$j("#mats_previews").hide();
					$j("#available_mats").hide();
					$j("#mats_line").hide();

					$j("#mats_left_arrow").hide();
					$j("#more_mats").hide();
					$j("#mats_right_arrow").hide();
					$j("ul#custom_option_mat").hide();
				}
			}
		);



		// When the user clicks on an option
		$j(".product-options input").click(
			
			function()
			{

				// Business logic cases
				// If Canvas is selected, show the related options
				if ( $j(this).parent().attr('class') == 'material_canvas' )
				{

					if (paper_active == 1)
					{
						reset_framing_matting();
					}

					canvas_active = 1;
					paper_active = 0;

					click_option("borders", 2, "canvas");
					activate_option_tab("borders");
					$j("li.treatments_none").hide();

					// Show canvas related sizes
					show_canvas(1);

					// Update the current product configuration
					selected_substrate = $j(this).next("span.label").find("label").html();

					// Slide the frame and mats tabs right
					$j("dt.frame").css("left", "645px");
					$j("dt.mat").css("left", "691px");

					// Matting is not available, and any matting selection is reset
					$j("dt.mat").hide();
					$j("dd.mat select option:eq(1)").attr("selected","selected");
					$j("dd.mat select option:eq(1)").trigger("click");

					// Show the "Canvas" framing category ONLY
					$j("select#frame_categories option").hide();
					$j("select#frame_categories option[value*='no_frame']").show();
					$j("select#frame_categories option[value*='Canvas']").show();
					
					// Currently disabled, until canvas framing becomes available again
					deactivate_option_tab("frame");

					// Canvas stretching is active by default
					$j("dd.canvas_stretching ul li input").trigger("click");

					// Update the current material information
					$j(".current_material").html($j(this).parent().attr('class'));
					$j("#product_configuration #selected_substrate").html(selected_substrate + " (" + selected_size + ") ");

					reset_matting();

					// Hide the matting option from the product configuration
					$j("#product_configuration #mats_status_label").hide();
		   			$j("#product_configuration #selected_mats").hide();
		   			$j("#product_configuration #selected_mats").next("a").hide();

		   			// Hide the special features for digital paper and canvas
		   			$j("#special_features").hide();
				}
				
				if ( $j(this).parent().attr('class') == 'material_photopaper' || $j(this).parent().attr('class') == 'material_posterpaper' )
				{

					if (canvas_active == 1)
					{
						reset_framing_matting();
						select_framing_category("Blacks");
					}

					canvas_active = 0;
					paper_active = 1;

					// Select no borders, as canvas is turned off
					click_option("borders", 1, "canvas");

					// Uncheck canvas stretching if already checked
					if ( $j("dd.canvas_stretching ul li input").attr('checked') == "checked" )
					{
						click_option("canvas_stretching", 1, "canvas");
					}

					deactivate_option_tab("borders");
					$j("li.treatments_none").hide();

					// Hide the borders
					$j("#three_inches_white_top_border").hide();
					$j("#three_inches_white_right_border").hide();

					// Update the current product configuration
					selected_substrate = $j(this).next("span.label").find("label").html();

					// Poster size
					poster_size = $j(".poster_size").html();


					if ( $j(this).parent().attr('class') == 'material_posterpaper' )
					{
						click_option("size", 0, "posterpaper");
						show_poster_paper();

						// Show the special features for poster only, if present
		   				$j("#special_features").show();

		   				// Show the exact poster size
		   				$j("#product_configuration #selected_substrate").html(selected_substrate + " (" + poster_size + ") ");
					}					
					
					if ( $j(this).parent().attr('class') == 'material_photopaper' )
					{
						click_option("size", 0, "photopaper");
						show_photo_paper();

						// Hide the special features for digital paper
		   				$j("#special_features").hide();

		   				$j("#product_configuration #selected_substrate").html(selected_substrate + " (" + selected_size + ") ");
					}



					activate_option_tab("frame");
					$j("select#frame_categories option").show();
					$j("select#frame_categories option[value*='Canvas']").hide();

					// Slide the frame and mats tabs left
					$j("dt.frame").css("left", "496px");
					$j("dt.mat").css("left", "645px");

					// Matting becomes available
					$j("dt.mat").show();

					// Update the current material information
					$j(".current_material").html($j(this).parent().attr('class'));

					


					// Hide the matting option from the product configuration
		   			$j("#product_configuration #selected_wrap").hide();
		   			$j("#product_configuration #selected_wrap").next("a").hide();
				}

				if ( $j(this).parent().parent().parent().parent().attr('class') == 'size' )
				{
					// Compute the selected size UI
					class_name = $j(this).parent().attr("class");

					// Make the currently selected size background dark green and deselect all the others
					clicked_size_index = $j(this).index()+1;
					$j("#custom_options_images ul .background_border_size").css("background-color", "");
					$j("#custom_options_images ul .background_border_size:nth-child(" + clicked_size_index +")").css("background-color", selected_size_background_color);

					oversize_flag = false;

					// Compute the exact size name
					if (class_name.indexOf("petite") != -1)
					{
						size_name = "petite";
						//size_scale_factor = 0.9;
					}
					else if (class_name.indexOf("small") != -1)
					{
						size_name = "small";
						//size_scale_factor = 1.0;
					}
					else if (class_name.indexOf("medium") != -1)
					{
						size_name = "medium";
						//size_scale_factor = 1.1;
					}
					else if (class_name.indexOf("oversize") != -1)
					{
						size_name = "oversize";
						//size_scale_factor = 1.3;

						oversize_flag = true;
					}
					else if (class_name.indexOf("oversize_large") != -1)
					{
						size_name = "oversize_large";
						//size_scale_factor = 1.4;

						oversize_flag = true;
					}
					else if (class_name.indexOf("large") != -1)
					{
						size_name = "large";
						//size_scale_factor = 1.2;
					}
					else
					{ 
						//size_scale_factor = 1.0;
					}

					// Resize the image in the preview
					if (rooms_view_enabled == 1)
					{
						display_rooms_view(1, 1);
					}


					// Store the visible standard sizes
					standard_sizes = $j("ul#custom_option_size li:visible").siblings();

					// Compute the selected size class name
					selected_size_name = $j("dd.size li input:checked").parent().attr('class');
					size_ui = selected_size_name.replace(/.*ui_/, '');
					end_index = size_ui.indexOf("_width");

					size_ui = size_ui.substr(0, end_index);

					// Add the size UI to the DOM in order to retrieve it later in reloadPrice()
					$j(".selected_size_ui").html(size_ui);

					// Update the current size information
					$j(".current_size").html($j(this).parent().attr('class'));



					// Display the selected width and height
					selected_width_index = $j(".current_size").html().indexOf("width_");
					selected_width = $j(".current_size").html().substr(selected_width_index + 6, 2);

					if (selected_width.indexOf("_") >= 0)
						selected_width = $j(".current_size").html().substr(selected_width_index + 6, 1);

					selected_length_index = $j(".current_size").html().indexOf("length_");
					selected_length = $j(".current_size").html().substr(selected_length_index + 7, 4);

					selected_size = selected_width + "\"" + "x" + selected_length + "\"";
					
					// If the the current substrate selection is Poster, show the corresponding dimension
					if (selected_substrate == "Poster ")
						$j("#size_data").html(poster_size);
					else
						$j("#size_data").html(selected_size);
					
					$j("#product_configuration #selected_substrate").html(selected_substrate + " (" + selected_size + ") ");

					// Compute the short and long sides of the image
					if (selected_width <= selected_length)
					{
						image_short_side = selected_width;
						image_long_side = selected_length;
					}
					else
					{
						image_short_side = selected_length;
						image_long_side = selected_width;
					}


					/* MATTING */
					// Show the corresponding matting options
					select_framing_category(last_selected_frame_category);
					//show_mats_options(mats_color_code);

					// Update the frame and mats prices
					update_ui_prices(size_ui, size_ui);

					// If the previously selected frame is not available anymore with the new size selection, then reset the framing and matting
					if (!is_frame_available(last_selected_frame_sku))
					{
						reset_framing_matting();
						//alert(last_selected_frame_sku + " is not available anymore with the new size selection");
					}
					
					// If the previously selected mat is not available anymore with the new size selection, then reset the matting
					if (!is_mat_available(last_selected_mat_sku))
					{
						reset_matting();
					}

					check_mats_visibility();

					if (number_of_shown_mats == 0)
						deactivate_option_tab("mat");
					else
						activate_option_tab("mat");

					if (rooms_view_enabled == 1)
						display_rooms_view(1, rooms_view_enabled);

				}

				// Select a treatment
				if ( $j(this).parent().parent().parent().parent().attr('class') == "borders" )
				{
					// Compute the treatment index
					checked_treatment_index = $j(this).parent().index();
					
					// Show the corresponding sizes
					show_canvas(checked_treatment_index);

					// Matting is not available, and any matting selection is reset
					$j("dt.mat").hide();
					$j("dd.mat select option:eq(1)").attr("selected","selected");
					$j("dd.mat select option:eq(1)").trigger("click");

					// Automatically check the first option available
					//alert(checked_treatment_index);
					click_option("size", checked_treatment_index, "canvas");

					// Update the current product configuration
					selected_borders = $j(this).next("span.label").find("label").html();
					$j("#product_configuration #selected_borders").html(selected_borders);

					// Show the framing option from the product configuration
	   				$j("#product_configuration #selected_borders").show();
	   				$j("#product_configuration #selected_borders").next("a").show();
				}

				if ( $j(this).parent().parent().parent().parent().attr('class') != "borders" && $j(this).parent().parent().parent().parent().attr('class') != "canvas_stretching")
				{
					// Hide the framing option from the product configuration
	   				$j("#product_configuration #selected_borders").hide();
	   				$j("#product_configuration #selected_borders").next("a").hide();
				}

				if ( $j(this).parent().parent().parent().parent().attr('class') == "canvas_stretching" )
				{
					selected_wrap = $j(this).next("span.label").find("label").html();
					$j("#product_configuration #selected_wrap").html(selected_wrap);
				}

				// Select a matting option
				// Update the selected size dynamically, based on the matting selection:
				// e.g. 3" matting ==> selected_size_ui += 3*2. Pricing is automatically recalculated
				if ( $j(this).parent().parent().parent().parent().attr('class') == "mat" )
				{

					mats_class = $j(this).parent().attr('class');
					currently_selected_size_ui = $j(".selected_size_ui").html();			

					if (mats_class != "mats_none")
					{
						// The matted size has to be counted 4 times, once for each dimension
						matted_size = parseFloat(currently_selected_size_ui) + 4 * parseFloat(mats_size);

						// Update the current product configuration
						selected_mats = $j(this).next("span.label").find("label").html();
						$j("#product_configuration #selected_mats").html(selected_mats);

						// Show the matting option from the product configuration
						$j("#product_configuration #mats_status_label").show();
			   			$j("#product_configuration #selected_mats").show();
			   			$j("#product_configuration #selected_mats").next("a").show();
					}

					else
					{
						matted_size = parseFloat(currently_selected_size_ui);

						// Hide the matting option from the product configuration
						$j("#product_configuration #mats_status_label").hide();
		   				$j("#product_configuration #selected_mats").hide();
		   				$j("#product_configuration #selected_mats").next("a").hide();
					}

					// Update the current mats information
					$j(".current_mats").html($j(this).parent().attr('class'));

					// Update the frame and mats prices
					update_ui_prices(currently_selected_size_ui, matted_size);
					
				}

			}
		);

		$j("li.canvas_stretching input").click(

			function()
			{
				// Update the current product configuration
				if ($j(this).is(":checked"))
					$j("#product_configuration #selected_wrap").show();
				else
					$j("#product_configuration #selected_wrap").hide();
			}

		);


		$j("select#frame_categories").change(

			function()
			{
				selected_category_node = $j(this).children(":selected");
				if (selected_category_node.length > 0)
				{
					category_name = selected_category_node.val().replace(/category_/,'');
					category_name = $j.trim(category_name);
				
					selected_size = $j("dd.size li input:checked");
   
	   				// If "No Frame" is selected, click the corresponding image, then disable the mats tab and reset any selected mats options to no mats
	   				if ( selected_category_node.val() == "no_frame" )
	   				{
	   					$j("li#frame_none").trigger("click");
	   					$j("dt.mat").hide();
	   					$j("dd.mat li.mats_none input").attr("checked", "checked");
	   					$j("dd.mat li.mats_none input").trigger("click");

	   					// Hide the framing option from the product configuration
	   					$j("#product_configuration #frame_status_label").hide();
	   					$j("#product_configuration #selected_frame").hide();
	   					$j("#product_configuration #selected_frame").next("a").hide();
	   				}

	   				select_framing_category(category_name);
	   			}
			}
		);

		/*
			2012-2014 Algorithm and Copyright by Axel Campailla. All rights reserved.
			
			Dynamic framing/matting rendering effect:
			function activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size)
		*/

		// Dynamic framing/matting effect
		function activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size)
		{

			if (frame_image_url.indexOf("/.png") != -1)
			{
			
				$j("#corner_bottom_right").clearCanvas({});
				$j("#corner_bottom_left").clearCanvas({});
				$j("#corner_top_right").clearCanvas({});
				$j("#corner_top_left").clearCanvas({});

				setTimeout(

					function()
					{
					
						$j("#edge_top").clearCanvas({});
						$j("#edge_bottom").clearCanvas({});
						$j("#edge_left").clearCanvas({});
						$j("#edge_right").clearCanvas({});

					}, 
				
				10);

				return;
			}


			var image_width = parseInt($j("#final_product_image").css("width").replace("px", ""));
			var image_height = parseInt($j("#final_product_image").css("height").replace("px", ""));

			var x = parseInt($j("#final_product_image").css("left").replace("px", ""));
			var y = parseInt($j("#final_product_image").css("top").replace("px", ""));

			// Corner data
			corner_x = 20*frame_scale_factor;
			corner_y = 20*frame_scale_factor;

			corner_s_width = 40;
			corner_s_height = 40;

			corner_sx = 100;
			corner_sy = 100;

			corner_width = 40*frame_scale_factor;
			corner_height = 40*frame_scale_factor;

			//.... End of Corner data //

			// Edge data
			edge_x = 20*frame_scale_factor;
			edge_y = 20*frame_scale_factor;

			edge_s_width = 80;
			edge_s_height = 40;

			edge_sx = 40;
			edge_sy = 100;

			edge_width = 40*frame_scale_factor;
			edge_height = 40*frame_scale_factor;

			//.... End of Edge data //

			if (frame_image_url.indexOf(".png\")"))
			{
				frame_image_source = frame_image_url.replace(".png\")", ".png").replace("\"http", "http");
			}

			else
			{
				frame_image_source = frame_image_url;
			}

			// If matting is applied
			if (mats_size != 0)
			{
				// Update the framing coordinates
				x -= mats_size * dpi;
				y -= mats_size * dpi;

				image_width += 2*mats_size * dpi;
				image_height += 2*mats_size * dpi;

				//edge_width += dpi;
				//edge_height += dpi;

				// Update the mats coordinates and size
				$j("#jcanvas_mats").css("top", y);
				$j("#jcanvas_mats").css("left", x);

				$j("#jcanvas_mats").css("width", image_width);
				$j("#jcanvas_mats").css("height", image_height);

				// Set the mats color
				$j("#jcanvas_mats").css("background-color", mats_color_code);

				// Display the mats color in the background
				$j("#jcanvas_mats").show();
			}

			// Else, hide the mats color in the background
			if (mats_size == 0)
			{
				$j("#jcanvas_mats").hide();
			}



			if (frame_width < edge_width)
			{
				shift_top = frame_width;
				shift_left = frame_height;
			}

			else
			{
				shift_top = edge_width;
				shift_left = edge_height;
			}


			// Bottom Right
			new_top = y + image_height;
			new_left = x + image_width;

			$j("#corner_bottom_right").clearCanvas({});

			$j("#corner_bottom_right").css("top", new_top);
			$j("#corner_bottom_right").css("left", new_left);

			$j("#corner_bottom_right").drawImage({
			  source: frame_image_source,
			  x: corner_x, y: corner_y,
			  sWidth: corner_s_width,
			  sHeight: corner_s_height,
			  sx: corner_sx, sy: corner_sy,
			  width: corner_width, height: corner_height
			}).restoreCanvas();



			// Top Left
			new_top = y - shift_top;
			new_left = x - shift_left;

			$j("#corner_top_left").clearCanvas({});

			$j("#corner_top_left").css("top", new_top);
			$j("#corner_top_left").css("left", new_left);

			$j("#corner_top_left").drawImage({
			  source: frame_image_source,
			  x: corner_x, y: corner_y,
			  sWidth: corner_s_width,
			  sHeight: corner_s_height,
			  sx: corner_sx, sy: corner_sy,
			  width: corner_width, height: corner_height,
			  rotate: 180
			}).restoreCanvas();



			// Bottom Left
			new_top = y + image_height;
			new_left = x - shift_left;

			$j("#corner_bottom_left").clearCanvas({});

			$j("#corner_bottom_left").css("top", new_top);
			$j("#corner_bottom_left").css("left", new_left);

			$j("#corner_bottom_left").drawImage({
			  source: frame_image_source,
			  x: corner_x, y: corner_y,
			  sWidth: corner_s_width,
			  sHeight: corner_s_height,
			  sx: corner_sx, sy: corner_sy,
			  width: corner_width, height: corner_height,
			  rotate: 90
			}).restoreCanvas();



			// Top Right
			new_top = y - shift_left;
			new_left = x + image_width;

			$j("#corner_top_right").clearCanvas({});

			$j("#corner_top_right").css("top", new_top);
			$j("#corner_top_right").css("left", new_left);

			$j("#corner_top_right").drawImage({
			  source: frame_image_source,
			  x: corner_x, y: corner_y,
			  sWidth: corner_s_width,
			  sHeight: corner_s_height,
			  sx: corner_sx, sy: corner_sy,
			  width: corner_width, height: corner_height,
			  rotate: 270
			}).restoreCanvas();


			var alpha_horizontal = Math.ceil(image_width / edge_width);
			var alpha_vertical = Math.ceil(image_height / edge_height);

				
			// Delay the code execution in order for IE to work properly
			setTimeout(

				function()
				{
					

					new_top = y + image_height;
					new_left = x - edge_width;

					$j("#edge_bottom").css("top", new_top);
					$j("#edge_bottom").css("left", new_left);

					$j("#edge_bottom").clearCanvas({});

					for (var i = 0; i < alpha_horizontal; i++)
					{ 
						$j("#edge_bottom").translateCanvas({
							translateX: edge_width, translateY: 0,
							autosave: false
						});

						$j("#edge_bottom").drawImage({
						  	source: frame_image_source,
						  	x: edge_x, y: edge_y,
						  	sWidth: edge_s_width,
						  	sHeight: edge_s_height,
						  	sx: edge_sx, sy: edge_sy,
						  	width: edge_width, height: edge_height
						}).restoreCanvas();

					}


					new_top = y - shift_top;
					new_left = x - shift_left;

					$j("#edge_top").css("top", new_top);
					$j("#edge_top").css("left", new_left);

					$j("#edge_top").clearCanvas({});

					for (var i = 0; i < alpha_horizontal; i++)
					{ 
						$j("#edge_top").translateCanvas({
							translateX: edge_width, translateY: 0,
							autosave: false
						});

						$j("#edge_top").drawImage({
						  	source: frame_image_source,
						  	x: edge_x, y: edge_y,
						  	sWidth: edge_s_width,
						  	sHeight: edge_s_height,
						  	sx: edge_sx, sy: edge_sy,
						  	width: edge_width, height: edge_height,
						  	rotate: 180,
							autosave: false
						}).restoreCanvas();
					}


					new_top = y - shift_top;
					new_left = x - shift_left;

					$j("#edge_left").css("top", new_top);
					$j("#edge_left").css("left", new_left);

					$j("#edge_left").clearCanvas({});

					for (var i = 0; i < alpha_vertical; i++)
					{ 
						$j("#edge_left").translateCanvas({
							translateX: 0, translateY: edge_height,
							autosave: false
						});

						$j("#edge_left").drawImage({
						  	source: frame_image_source,
						  	x: edge_x, y: edge_y,
						  	sWidth: edge_s_width,
						  	sHeight: edge_s_height,
						  	sx: edge_sx, sy: edge_sy,
						  	width: edge_width, height: edge_height,
						  	rotate: 90
						}).restoreCanvas();
					}


					new_top = y - shift_top;
					new_left = x + image_width;

					$j("#edge_right").css("top", new_top);
					$j("#edge_right").css("left", new_left);

					$j("#edge_right").clearCanvas({});

					for (var i = 0; i < alpha_vertical; i++)
					{ 
						$j("#edge_right").translateCanvas({
							translateX: 0, translateY: edge_height,
							autosave: false
						});

						$j("#edge_right").drawImage({
						  	source: frame_image_source,
						  	x: edge_x, y: edge_y,
						  	sWidth: edge_s_width,
						  	sHeight: edge_s_height,
						  	sx: edge_sx, sy: edge_sy,
						  	width: edge_width, height: edge_height,
						  	rotate: 270
						}).restoreCanvas();
					}

				}, 
			
			10);

			/* End of code execution delay */

			image_margin_top = parseInt($j("#final_product_image").css("margin-top").replace("px",""));
			image_margin_left = parseInt($j("#final_product_image").css("margin-left").replace("px",""));

			$j("#jcanvas_frame").css("position", "relative");
			$j("#jcanvas_frame").css("margin-top", image_margin_top);
			$j("#jcanvas_frame").css("margin-left", image_margin_left);

			$j("#jcanvas_mats").css("margin-top", image_margin_top);
			$j("#jcanvas_mats").css("margin-left", image_margin_left);

			
		}

		/*
			2012-2014 Algorithm and Copyright by Axel Campailla. All rights reserved.
			
			Dynamic framing/matting rendering effect:
			function activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size)
		*/


		// Highlight an image when clicked
		$j("ul#custom_option_frame li").click(
			
			function()
			{
				frame_sku = $j(this).attr('id');
				// Update the current frame information
				$j(".current_frame").html(frame_sku);
				last_selected_frame_sku = frame_sku;

				selected_frame_maximum_long_side = $j(this).data("frame_maximum_long_side");
				selected_frame_maximum_short_side = $j(this).data("frame_maximum_short_side");

				frame_available_4_canvas = $j(this).data("frame_available_4_canvas");


				highlighted_border = "1px solid #04A6E4";
				original_border = "1px solid #cccccc";

				frame_size = $j(this).data("frame_size");
				frame_scale_factor = frame_size * viewport_scale_factor;

				// Remove the highlighting border from every other framing choice
				$j("ul#custom_option_frame li").css("border", original_border);
				// Highlight the selected image
				$j(this).css("border", highlighted_border);

				// Select the corresponding dropdown value from the framing list
				clicked_image_index = $j(this).index()+1;
				$j("dd.frame select option:eq(" + clicked_image_index + ")").attr("selected", "selected");
				$j("dd.frame select").change();

				// If the previously selected mat is not available anymore with the new size selection, then reset the matting
				if (!is_mat_available(last_selected_mat_sku))
				{
					reset_matting();
				}

				check_mats_visibility();

				if (number_of_shown_mats == 0)
					deactivate_option_tab("mat");
				else
					activate_option_tab("mat");

				if (frame_available_4_canvas == "Yes")
				{
					deactivate_option_tab("mat");
				}

				frame_image_url = $j(this).find(".frame_corner_image").css("background-image").replace("url(", "").replace(".png)", ".png").replace("small_images", "large_images");

				if (framing_enabled == 0 && frame_image_url.indexOf("/.png") == -1 && rooms_view_enabled == 0)
				{
					framing_enabled = 1;

					// Recompute the image geometric features
					background_width = background_container_width - 2 * frame_width;
					background_height = background_container_height  - 2 * frame_height;

					width = parseInt($j("#final_product_image").css("width").replace("px", ""));
					height = parseInt($j("#final_product_image").css("height").replace("px", ""));

					// In Percentage
					top_percentage = 50;
					left_percentage = 50;

					x = width/background_width;
					y = height/background_height;

					max_size = Math.max(x, y);

					width = width/max_size;
					height = height/max_size;

					width_percentage = (width/background_width) * 100;
					height_percentage = (height/background_height) * 100;

					width = background_width * (width_percentage/100);
					height = background_height * (height_percentage/100);

					margin_top_percentage = height_percentage/-2;
					margin_left_percentage = width_percentage/-2;
					

					// In Pixels
					top = background_height * (top_percentage/100) + frame_height;
					left = background_width * (left_percentage/100) + frame_width;

					margin_top = background_height * (margin_top_percentage/100);
					margin_left = background_width * (margin_left_percentage/100);
					
					//alert("test 1");
					
					// Resize the image
					resize_image(width, height, top, left, margin_top, margin_left);
				}

				else if (framing_enabled == 1 && frame_image_url.indexOf("/.png") != -1)
				{
					framing_enabled = 0;
					matting_enabled = 0;

					//alert("test 2");
					resize_image(original_image_width, original_image_height, original_image_top, original_image_left, original_image_margin_top, original_image_margin_left);
				}

				else
				{
					//alert("test 3");
					// Display the dynamic framing effect
					activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size);
				}
				
				// Update the current product configuration
				selected_frame = $j(this).find(".frame_title").html();
				$j("#product_configuration #selected_frame").html(selected_frame);

				// Show the framing option from the product configuration
				$j("#product_configuration #frame_status_label").show();
				$j("#product_configuration #selected_frame").show();
				$j("#product_configuration #selected_frame").next("a").show();
			}

		);


		// Frame category sliding: left
		$j("#category_frames_left_arrow_2").click(

			function()
			{
				// Compute the currently selected node
				selected_category_node = $j("select#frame_categories").children(":selected");
				
				// Compute the previous node
				previous_node = selected_category_node.prev();

				// If the next node is visible, display the corresponding category
				if ( previous_node.css("display").indexOf("none") < 0 )
				{
					// Compute the currently selecte size UI
					selected_size_name = $j("dd.size li input:checked").parent().attr('class');
					
					// Select the new element
					$j(previous_node).attr("selected", "selected");
					$j(previous_node).trigger("click");

					// Show the corresponding images
					show_framing_images($j(previous_node).html());
				}

				// If no frame is scrolled to in the list, hide the mats tab and reset the mats options to no mats
				if ( previous_node.attr("value") == "no_frame" )
				{
					$j("dt.mat").hide();
					$j("dd.mat li.mats_none input").attr("checked", "checked");
   					$j("dd.mat li.mats_none input").trigger("click");

   					// Trigger the change event to reset the framing price
					$j("select#frame_categories option[value='no_frame']").attr("selected", "selected");
					$j("select#frame_categories option[value='no_frame']").trigger("change");
				}
			}
		);

		// Frame category sliding: right
		$j("#category_frames_right_arrow_2").click(

			function()
			{
				// Compute the currently selected node
				selected_category_node = $j("select#frame_categories").children(":selected");
				
				// Compute the previous node
				next_node = selected_category_node.next();

				// If the next node is visible, display the corresponding category
				if ( next_node.css("display").indexOf("none") < 0 )
				{
					// Compute the currently selecte size UI
					selected_size_name = $j("dd.size li input:checked").parent().attr('class');
					
					// Select the new element
					$j(next_node).attr("selected", "selected");
					$j(next_node).trigger("click");

					// Show the corresponding images
					show_framing_images($j(next_node).html());
				}
			}
		);

		// Product image automatic resizing on rooms view
		var original_image_width = 1;
		var original_image_height = 1;
		var original_image_top = 1;
		var original_image_left = 1;
		var original_image_margin_top = 1;
		var original_image_margin_left = 1;


		function load_product_image()
		{

			// Get the final product image size
			img = new Image;
			product_background_image = $j("#final_product_image");

			if (product_background_image.length > 0)
				img.src = $j(".image_url").html();
			else
				return;

			$j(img).load(function() {    
			          
				width = img.width;
				height = img.height;

				background_width = 450;
				background_height = 450;

				top_distance = background_height/2;
				left_distance = background_width/2;

				// In Percentage
				x = width/background_width;
				y = height/background_height;

				max_size = Math.max(x, y);

				width = width/max_size;
				height = height/max_size;

				width_percentage = (width/background_width) * 100;
				height_percentage = (height/background_height) * 100;

				margin_top_percentage = height_percentage/-2;
				margin_left_percentage = width_percentage/-2;


				// In Pixels
				width = background_width * (width_percentage/100);
				height =background_height * (height_percentage/100);

				margin_top = background_height * (margin_top_percentage/100);
				margin_left = background_width * (margin_left_percentage/100);

				// Set the final product image coordinates
				$j("#final_product_image").css("width", width);
				$j("#final_product_image").css("height", height);
				$j("#final_product_image").css("top", top_distance);
				$j("#final_product_image").css("left", left_distance);
				$j("#final_product_image").css("margin-top", margin_top);
				$j("#final_product_image").css("margin-left", margin_left);

				original_image_width = width;
				original_image_height = height;
				original_image_top = top_distance;
				original_image_left = left_distance;
				original_image_margin_top = margin_top;
				original_image_margin_left = margin_left;


				$j("#final_product_image").show();
			});
		}		

		

		/********************* Defaults: ******************/

		load_product_image();
		
		// Show the custom optins images: default active is material
		enable_option("material");
		
		// Paper is selected by default, so borders is not available
		disable_option("borders");

		// Show the default paper related sizes only
		poster_available = $j(".poster_available").html();
		paper_available = $j(".paper_available").html();

		// Image orientation
		orientation = $j(".orientation").html();

		function compute_borders_index(size_sku)
		{
			// E.g. "size_canvas_medium_treatment_1_ui_54_width_18_length_36"
			// We should compute the number after the substring "treatment_"
			var borders_index_start = size_sku.indexOf("treatment_");
			var borders_index_end = size_sku.indexOf("_ui");

			// Get the substring between those two substrings, and add 1 since 1 would be treatments_none
			var borders_index = size_sku.substring(borders_index_start + 10, borders_index_end) + 1;

			return borders_index;
		}


		function set_current_customization()
		{
			// Parse the current URL and extract the individual option parameters
			var custom_material = custom_url.param('material');
			var custom_size = custom_url.param('size');
			
			var custom_borders_index = "";
			var custom_stretching = custom_url.param('stretching');
			
			var custom_frame = custom_url.param('frame');
			var custom_mat = custom_url.param('mat');

			// Material
			if (typeof custom_material !== "undefined")
			{
				//alert("material " + custom_material);
				click_option("material", "", custom_material);
			}

			// Size
			if (typeof custom_size !== "undefined")
			{
				//alert("size " + custom_size);
				set_size(custom_size);

				// If material is canvas, compute the borders index
				if (custom_material == "canvas")
				{
					// Borders
					custom_borders_index = compute_borders_index(custom_size);
					click_option("borders", custom_borders_index, "canvas");
				}
			}

			//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

			// Canvas Stretching
			if (typeof custom_stretching !== "undefined")
			{
				//alert("stretching " + custom_stretching);
				$j("dd.canvas_stretching ul li[class*='" + custom_stretching + "']:eq(0) input").trigger("click");
			}

			// Frame
			if (typeof custom_frame !== "undefined")
			{
				//alert("frame " + custom_frame);
				$j("ul#custom_option_frame li[id='" + custom_frame + "']").trigger("click");
			}

			else
			{
				click_option("framing", 1, "");
			}

			// Mat
			if (typeof custom_mat !== "undefined")
			{
				//alert("mat " + custom_mat);
				$j("ul#custom_option_mat li[id*='" + custom_mat + "']").trigger("click");
			}

			else
			{
				click_option("mat", 1, "");
			}
		}



		// Parse the URL and automatically select a specific customization of an image
		custom_url = $j.url();
		if (custom_url.param('material'))
		{
			set_current_customization();
		}

		else
		{
			// Set custom options defaults for faster checkout
			// Trigger their click events to update the overal proudct price

			// If paper is available
			// Select the medium size, if available, otherwise select the first paper size avaialble
			if (paper_available == 1)
			{
				click_option("material", "", "photopaper");

				if (size_exists("size_photopaper_medium"))
				{
					click_option("size", 0, "photopaper_medium");
				}
				else
				{
					click_option("size", 0, "photopaper");
				}
			}
			else
			{
				click_option("material", "", "posterpaper");
				click_option("size", 0, "posterpaper");	
			}

			var options = new Array("borders", "framing", "mat");
			for (var i = 0; i < options.length; i++)
			{ 
				click_option(options[i], 1, "");
			}
		}


		// If the borders tab is not active yet, slide the others on its right towards the left
		if ( $j("dt.borders").is(":visible") == false )
		{
			$j("dt.frame").css("left", "496px");
			$j("dt.mat").css("left", "645px");
		}


		if (custom_url.length == 0)
		{
			// Select the No Frame category
			$j('dd.frame option:eq(1)').attr('selected','selected');

			/** MATTING**/
			// Select No Mats
			$j('dd.mat option:eq(1)').attr('selected','selected');

			// Default matting option is none
			$j("ul#custom_option_mat li#mats_none").trigger("click");
		}

		// Compute the selected size class name
		selected_size_name = $j("dd.size li input:checked").parent().attr('class');
		if ( selected_size_name )
			size_ui = selected_size_name.replace(/.*ui_/, '');

		// Clicking a custom option image should automatically select the corresponding button
		$j("#custom_options_images ul .custom_option_viewport").click(

			function()
			{
				clicked_image_index = $j(this).parent().index();
				$j("dd:visible ul li:eq(" + clicked_image_index + ") input").attr("checked", "checked");
				$j("dd:visible ul li:eq(" + clicked_image_index + ") input").trigger("click");
			}
		);

		// Clicking a custom option image should automatically select the corresponding button: SPECIFIC FOR THE SIZE OPTIONS
		$j(".background_border_size").click(

			function()
			{
				clicked_image_index = $j(this).index();
				$j("dd.size ul li:eq(" + clicked_image_index + ") input").attr("checked", "checked");
				$j("dd.size ul li:eq(" + clicked_image_index + ") input").trigger("click");

				// Make the currently selected size background dark green and deselect all the others
				if ( $j(this).attr("id") != "custom_size_button_background" )
				{
					$j(".background_border_size").css("background-color", "");
					$j(this).css("background-color", selected_size_background_color);
				}
			}
		);


		select_framing_category("Blacks");	
		show_mats_options(mats_color_code);

		$j("dt.material label").html("Material & Size");	

		// Display the whole custom options section, only when everything else has loaded
		$j(".product-view").show();
		

		/********************* End of defaults ******************/


		// *************** END OF CUSTOM OPTIONS ***************
		
		
		$j(".category-products .category_product_image, .products_collections").hover(
		
			function () {
				$j(this).parent().nextAll(".social_bar").stop(true).animate({ opacity: 1 });
			}, 
			
			function () {
				$j(this).parent().nextAll(".social_bar").animate({ opacity: 0 });
			}
			
		);
		
		$j(".social_bar:not('.product-view .social_bar')").hover(
		
			function () {
				$j(this).stop(true).animate({ opacity: 1 });
			}, 
			
			function () {
				$j(this).animate({ opacity: 0 });
			}
			
		);
		
		
		$j("a[rel^='prettyPhoto']").prettyPhoto();
		
		$j("#full_screen, #full_screen_text").click(function() {
		
			$j("a[rel^='prettyPhoto']").trigger("click");
		
		});

		
		
		// Automatic image resizing based on the image ratio
		function resize_image(width, height, top, left, margin_top, margin_left)
		{
			// Animate the automatic image resizing to make it fit nicely into the room			
			$j("#final_product_image").animate({ width: width, height: height, top: top, left: left, "margin-top": margin_top, "margin-left": margin_left }, "fast", function(){
				activate_dynamic_framing_matting(frame_image_url, mats_color_code, mats_size)
			});
		}

		function display_design_view()
		{
			rooms_view_enabled = 0;

			// Reset the final image background
			$j("#final_product_image_background").css("background", "");

			width_percentage = 100/100;
			height_percentage = 100/100;

			width = original_image_width;
			height = original_image_height;

			image_top = original_image_top;
			image_left = original_image_left;

			margin_top = original_image_margin_top;
			margin_left = original_image_margin_left;

			background_width = 450;
			background_height = 450;

			width = original_image_width;
			height = original_image_height;

			reset_framing_matting();

			// In Percentage
			top_percentage = 50;
			left_percentage = 50;

			x = width/background_width;
			y = height/background_height;

			max_size = Math.max(x, y);

			width = width/max_size;
			height = height/max_size;

			width_percentage = (width/background_width) * 100;
			height_percentage = (height/background_height) * 100;

			width = background_width * (width_percentage/100);
			height = background_height * (height_percentage/100);

			margin_top_percentage = height_percentage/-2;
			margin_left_percentage = width_percentage/-2;
				

			// In Pixels
			top = background_height * (top_percentage/100) + frame_height;
			left = background_width * (left_percentage/100) + frame_width;

			margin_top = background_height * (margin_top_percentage/100);
			margin_left = background_width * (margin_left_percentage/100);

			resize_image(width, height, image_top, image_left, margin_top, margin_left);
		}

		function display_rooms_view(room_index, rooms_view_state)
		{
			rooms_view_enabled = rooms_view_state;

			if (orientation == "portrait" && selected_width > selected_length)
			{
				temp = selected_width;
				selected_width = selected_length;
				selected_length = temp;
			}

			real_width = selected_width * size_scale_factor;
			real_height = selected_length * size_scale_factor;

			real_top = furniture_image_gap - real_height;
			real_left = (background_container_width - real_width) / 2;

			if (framing_enabled == 1 && rooms_view_enabled == 0)
			{
				// Recompute the image geometric features
				background_width -= 2 * frame_width;
				background_height -= 2 * frame_height;
			}

			if (matting_enabled == 1 && rooms_view_enabled == 0)
			{
				// Recompute the image geometric features
				background_width -= 2 * mats_size*dpi;
				background_height -= 2 * mats_size*dpi;
			}

			resize_image(real_width, real_height, real_top, real_left, 0, 0);
		}
		
		// Wall Color
		$j("#wall_color").click(function () {
		
			var original_background_color = $j("#final_product_image_background").css("background-color");

			// Hide the rooms view first if it is visible or if the image background has been altered in the meantime
			if ( $j("#room_switch").is(":visible") || $j("#final_product_image_background").attr("background") != "none") 
			{
				// Hide the rooms view
				$j("#room_switch").slideUp("fast");
				// Reset the room wall to a white background
				$j("#final_product_image_background").css("background", "none");
				// Restore the background color
				$j("#final_product_image_background").css("background-color", original_background_color);
			}
			
			// Hide the rooms view first if it is visible or if the image background has been altered in the meantime
			if ( $j("#details_switch").is(":visible") ) 
			{
				// Hide the details view
				$j("#details_switch").slideUp("fast");
				// Reset the room wall to a white background
				$j("#final_product_image_background").css("background", "none");
			}
		
			//$j("#color_switch").css("visibility", "visible");
			if ( $j("#color_switch").is(":hidden") ) 
			{
				// Show the color switch tab
				$j("#color_switch").slideDown("slow");
				$j("#hide_button").css("top", "403px");
				$j("#hide_button").slideDown("slow");
			}
			
			else
			{
				// Hide the color switch tab
				$j("#color_switch").slideUp("fast");
				$j("#hide_button").slideUp("fast");
			}
		});
		
		// Select a color
		$j(".color").click(function () {
			
			// Automatic image resizing
			display_rooms_view(1, 1);
			
			// Change the product image background color
			$j("#final_product_image_background").css("background-color", $j(this).css("background-color"));

			
		});
		
		$j("#hide_button").click(function () {
		
			// Hide the color switch tab
			$j("#color_switch").slideUp("fast");
			$j("#room_switch").slideUp("fast");
			$j("#details_switch").slideUp("fast");
			$j("#hide_button").slideUp("fast");
		});
		
		
		// Rooms
		$j("#rooms").click(function () {
		
			// Hide the color switch first if it is visible
			if ( $j("#color_switch").is(":visible") ) 
			{
				$j("#color_switch").slideUp("fast");
			}
			
			// Hide the details switch first if it is visible
			if ( $j("#details_switch").is(":visible") ) 
			{
				$j("#details_switch").slideUp("fast");
			}
		
			if ( $j("#room_switch").is(":hidden") ) 
			{
				// Show the room switch tab
				$j("#room_switch").slideDown("slow");
				$j("#hide_button").css("top", "388px");
				$j("#hide_button").slideDown("slow");
			}
			
			else
			{
				// Hide the room switch tab
				$j("#room_switch").slideUp("fast");
				$j("#hide_button").slideUp("fast");
			}
		});

		
		// Select a room
		$j(".room_thumbnail").click(function () {
		
			// Change the product image background
			background_value = "url('" + $j(this).attr("src") + "')";
			$j("#final_product_image_background").css("background", background_value);
			
			room_index = $j(this).index();
			display_rooms_view(room_index, 1);
		});


		// Reset image
		$j("#reset").click(function () {
		
			display_design_view();	
		});
		
		
		// Details
		$j("#details").click(function () {
		
			// Hide the room switch first if it is visible
			if ( $j("#room_switch").is(":visible") ) 
			{
				$j("#room_switch").slideUp("fast");
			}
			
			// Hide the color switch first if it is visible
			if ( $j("#color_switch").is(":visible") ) 
			{
				$j("#color_switch").slideUp("fast");
			}
		
			if ( $j("#details_switch").is(":hidden") ) 
			{
				// Show the details switch tab
				$j("#details_switch").slideDown("slow");
				$j("#hide_button").css("top", "388px");
				$j("#hide_button").slideDown("slow");
			}
			
			else
			{
				// Hide the details switch tab
				$j("#details_switch").slideUp("fast");
				$j("#hide_button").slideUp("fast");
			}
		});
		
		

		/* S3 code */

		$j("#s3_image").load(function() 
		{
			$j("#s3_result_light_box").trigger("click");
		   $j("#s3_redirect").submit();
		});

		$j(".custom_art #accept_checkbox").trigger("click");

		// Check if the disclaimer checkbox on the "Create your Art" page is checked
		// If it is, enable the upload button, otherwise disable it
		$j(".custom_art #accept_checkbox").click(

			function()
			{
				if ( $j(this).is(":checked") )
				{
					$j("#s3_image_submit").attr("disabled", false);
				}

				else
				{
					$j("#s3_image_submit").attr("disabled", true);
				}
			}
		);

		$j("#s3_file_input").change(
			function()
			{
				$j("#s3_image_submit").trigger("click");
			}
		);

		/* End of S3 code */


		// Hide the canvas material option if its corresponding attribute is either N o blank
		if ($j(".canvas_available").html() == "0" || $j(".canvas_available").html() == "")
		{
			$j("#custom_option_material_canvas_background").hide();
			$j("dd li.material_canvas").hide();
		}

		else
		{
			$j("#custom_option_material_canvas_background").show();
			$j("dd li.material_canvas").show();
		}

		// Display the out of stock message when the product is out of stock
		if ( $j(".is_in_stock").html() == "0" )
		{
			$j(".out_of_stock_message").show();
			$j(".price-box span.regular-price span.price").hide();
		}


		/*
		if (browser.indexOf("Safari") != -1)
		{
			final_product_image_margin_top_safari = parseInt($j("#final_product_image").css("margin-top")) + 220;
			$j("#final_product_image").css("margin-top", final_product_image_margin_top_safari + "px");
		}
		*/


		$j("#customize_substrate_link").click(
			function()
			{
				$j(".product-options dl dt.material label").trigger("click");
			}
		);

		$j("#customize_borders_link").click(
			function()
			{
				$j(".product-options dl dt.borders label").trigger("click");
			}
		);

		$j("#customize_wrap_link").click(
			function()
			{
				$j(".product-options dl dt.borders label").trigger("click");
			}
		);

		$j("#customize_frame_link").click(
			function()
			{
				$j(".product-options dl dt.frame label").trigger("click");
			}
		);

		$j("#customize_mats_link").click(
			function()
			{
				$j(".product-options dl dt.mat label").trigger("click");
			}
		);

	});
	
	